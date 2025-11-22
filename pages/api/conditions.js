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
                    // Case-insensitive regex for body_area
                    query.body_area = { $regex: new RegExp(`^${bodyArea}$`, 'i') };
                }

                console.log('Mongo Query:', query);

                // 2. Fetch all matching documents for the body area
                // We fetch all because we need to parse the 'age' string field in JS
                const allConditions = await Condition.find(query).lean();
                console.log(`Found ${allConditions.length} documents for bodyArea ${bodyArea}`);

                // 3. Filter by Age Group in JavaScript
                const filteredConditions = allConditions.filter(doc => {
                    if (!ageGroup) return true;
                    if (!doc.age || typeof doc.age !== 'string') return false;

                    // Parse "18 - 150" or similar
                    // Regex to find the first number (start age) and second number (end age)
                    const matches = doc.age.match(/(\d+)\s*-\s*(\d+)/);
                    if (!matches) return false;

                    const startAge = parseInt(matches[1], 10);

                    if (ageGroup === 'adult') {
                        // User rule: 18 above is adult
                        return startAge >= 18;
                    } else if (ageGroup === 'child') {
                        // User rule: under 18 is child
                        return startAge < 18;
                    }
                    return true;
                });

                console.log(`Filtered to ${filteredConditions.length} documents after age check (${ageGroup})`);

                if (type === 'panels') {
                    // Extract unique panels from the filtered list
                    const panels = [...new Set(filteredConditions.map(c => c.panel))].filter(Boolean).sort();
                    console.log('Returning panels:', panels);
                    res.status(200).json({ success: true, data: panels });
                } else if (type === 'conditions') {
                    // Filter by panel if provided
                    let finalList = filteredConditions;
                    if (panel) {
                        finalList = finalList.filter(c => c.panel === panel);
                    }

                    // Deduplicate based on condition name
                    const uniqueConditions = [];
                    const seen = new Set();

                    for (const c of finalList) {
                        if (!seen.has(c.condition)) {
                            seen.add(c.condition);
                            uniqueConditions.push({
                                condition: c.condition,
                                severity: c.severity
                            });
                        }
                    }

                    console.log(`Returning ${uniqueConditions.length} unique conditions for panel ${panel}`);
                    res.status(200).json({ success: true, data: uniqueConditions });
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
                                    score: radiationScore
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
