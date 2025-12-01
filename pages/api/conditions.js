import dbConnect from '../../lib/mongodb';
import Condition from '../../models/Condition';

export default async function handler(req, res) {
    const { method } = req;

    await dbConnect();

    switch (method) {
        case 'GET':
            try {
                const { ageGroup, bodyArea, type, panel, condition } = req.query;

                console.log('API Request:', { ageGroup, bodyArea, type, panel, condition });

                // 1. Build initial query for Body Area
                const query = {};
                if (bodyArea) {
                    // Case-insensitive regex for body_area OR Body Area
                    // Strict match but allow for surrounding whitespace
                    const regex = new RegExp(`^\\s*${bodyArea}\\s*$`, 'i');
                    query.$or = [
                        { body_area: { $regex: regex } },
                        { "Body Area": { $regex: regex } }
                    ];
                }

                console.log('Mongo Query:', JSON.stringify(query));

                // 2. Fetch all matching documents for the body area
                // We fetch all because we need to parse the 'age' string field in JS
                const allConditions = await Condition.find(query).lean();
                console.log(`Found ${allConditions.length} documents for bodyArea ${bodyArea}`);

                // 3. Filter by Age Group in JavaScript
                const filteredConditions = allConditions.filter(doc => {
                    if (!ageGroup) return true;

                    const ageStr = doc.age || doc.Age;
                    if (!ageStr || typeof ageStr !== 'string') return false;

                    // Parse age ranges like "10 - 60", "18 - 150", "0 - 18"
                    const rangeMatch = ageStr.match(/(\d+)\s*-\s*(\d+)/);
                    let startAge, endAge;
                    
                    if (rangeMatch) {
                        // Age range found
                        startAge = parseInt(rangeMatch[1], 10);
                        endAge = parseInt(rangeMatch[2], 10);
                    } else {
                        // Single age or other format, try to extract first number
                        const singleMatch = ageStr.match(/(\d+)/);
                        if (!singleMatch) return false;
                        startAge = parseInt(singleMatch[1], 10);
                        endAge = startAge; // Assume single age applies to that age only
                    }

                    if (ageGroup === 'adult') {
                        // Include if the age range includes adults (18+)
                        return endAge >= 18;
                    } else if (ageGroup === 'child') {
                        // Include if the age range includes children (<18)
                        return startAge < 18;
                    }
                    return true;
                });

                console.log(`Filtered to ${filteredConditions.length} documents after age check (${ageGroup})`);

                if (type === 'panels') {
                    // Extract unique panels from the filtered list
                    const panels = [...new Set(filteredConditions.map(c => c.panel || c.Panel))].filter(Boolean).sort();
                    console.log('Returning panels:', panels);
                    res.status(200).json({ success: true, data: panels });
                } else if (type === 'conditions') {
                    // Filter by panel if provided
                    let finalList = filteredConditions;
                    if (panel) {
                        const normalizedPanel = panel.trim().toLowerCase();
                        console.log(`Filtering by panel: "${panel}" (normalized: "${normalizedPanel}")`);
                        finalList = finalList.filter(c => {
                            const p = c.panel || c.Panel;
                            const matches = p && p.trim().toLowerCase() === normalizedPanel;
                            if (!matches && p) {
                                console.log(`  Skipping doc with panel: "${p}" (normalized: "${p.trim().toLowerCase()}")`);
                            }
                            return matches;
                        });
                        console.log(`After panel filter: ${finalList.length} documents`);
                    }

                    // Deduplicate based on condition name
                    const uniqueConditions = [];
                    const seen = new Set();

                    for (const c of finalList) {
                        const conditionName = c.condition || c.Condition;
                        if (conditionName && !seen.has(conditionName)) {
                            seen.add(conditionName);
                            uniqueConditions.push({
                                condition: conditionName,
                                severity: c.severity || c.Severity
                            });
                        }
                    }

                    console.log(`Returning ${uniqueConditions.length} unique conditions for panel ${panel}`);
                    console.log('Conditions list:', JSON.stringify(uniqueConditions, null, 2));
                    
                    // Filter out any placeholder entries
                    const cleanedConditions = uniqueConditions.filter(c => 
                        c.condition && c.condition.toLowerCase() !== 'placeholder'
                    );
                    
                    console.log(`After filtering placeholders: ${cleanedConditions.length} conditions`);
                    res.status(200).json({ success: true, data: cleanedConditions });
                } else if (type === 'scenarios') {
                    // Filter by panel and condition
                    let finalList = filteredConditions;
                    if (panel) {
                        finalList = finalList.filter(c => c.panel === panel);
                    }

                    if (condition) {
                        finalList = finalList.filter(c => c.condition === condition);
                    }

                    // Deduplicate scenarios
                    const uniqueScenarios = [];
                    const seenScenarios = new Set();

                    for (const c of finalList) {
                        if (!seenScenarios.has(c.scenario_id)) {
                            seenScenarios.add(c.scenario_id);
                            uniqueScenarios.push({
                                scenario_id: c.scenario_id,
                                scenario_description: c.scenario_description,
                                _id: c._id
                            });
                        }
                    }

                    console.log(`Returning ${uniqueScenarios.length} scenarios for condition ${condition}`);
                    res.status(200).json({ success: true, data: uniqueScenarios });

                } else if (type === 'results') {
                    const { scenarioId } = req.query;
                    if (!scenarioId) {
                        return res.status(400).json({ success: false, error: "scenarioId is required for results" });
                    }

                    const results = await Condition.find({ scenario_id: scenarioId }).lean();

                    console.log(`Found ${results.length} results for scenarioId ${scenarioId}`);

                    // Extract procedures from the nested array
                    const allProcedures = [];
                    results.forEach(doc => {
                        if (doc.procedures && Array.isArray(doc.procedures)) {
                            doc.procedures.forEach(proc => {
                                // Determine radiation level based on ageGroup
                                let radiationStr = '';
                                if (ageGroup === 'adult') {
                                    radiationStr = proc.adult_rrl || '';
                                } else {
                                    radiationStr = proc.peds_rrl || '';
                                }

                                // Parse radiation value from strings like "0 mSvO", "1-10 mSv☢☢☢", "10-30 mSv☢☢☢☢"
                                let radiationScore = 0;
                                if (radiationStr) {
                                    // Extract the first number or range
                                    const match = radiationStr.match(/(\d+)(?:-(\d+))?/);
                                    if (match) {
                                        // Use the upper bound if it's a range, otherwise use the single value
                                        radiationScore = parseInt(match[2] || match[1], 10);
                                    }
                                }

                                allProcedures.push({
                                    name: proc.procedure_name,
                                    appropriate: proc.appropriateness_category,
                                    radiation: radiationScore,
                                    score: radiationScore,
                                    radiationString: radiationStr
                                });
                            });
                        }
                    });

                    console.log('Total procedures extracted:', allProcedures.length);
                    console.log('Sample procedures:', allProcedures.slice(0, 3));

                    res.status(200).json({ success: true, data: allProcedures });

                } else {
                    res.status(200).json({ success: true, data: filteredConditions });
                }

            } catch (error) {
                console.error(error);
                res.status(400).json({ success: false, error: error.message });
            }
            break;
        default:
            res.status(400).json({ success: false });
            break;
    }
}
