// contains vendor assessment function 
//  returns the assessment reasoned by LLM for a specific vendor

import fs from "fs";
import OpenAI from "openai";

console.log('api key in agent.js', process.env.API_KEY_OPENAI); // debugging

let openaiClient = null; 
function getOpenAIClient() { // this function was the solution to the open ai api being called before env variables were loaded
    if (!openaiClient) {
        if (!process.env.API_KEY_OPENAI) {
            throw new Error("API_KEY_OPENAI environment variable is not set");
        }
        openaiClient = new OpenAI({apiKey: process.env.API_KEY_OPENAI});
    }
    return openaiClient;
}

const policies = fs.readFileSync("./data/policies.txt", "utf-8"); // load policies
const thresholds = JSON.parse(fs.readFileSync("./data/riskThresholds.json", "utf-8")); // load thresholds


function validateSchema(data) { // schema validation for model response to ensure correct formatting
    const required = ['risk_level', 'explanation', 'recommendation'];
    const validLevels = ['LOW', 'MEDIUM', 'HIGH'];
    const validRecs = ['Auto-approve', 'Request clarification', 'Escalate to security team'];
    
    for (const field of required) {
        if (!(field in data)) throw new Error(`Missing: ${field}`); // we need every field to be complete or throw error
    }
    if (!validLevels.includes(data.risk_level)) throw new Error('Invalid risk level'); // if not risk level give error
    if (!validRecs.includes(data.recommendation)) throw new Error('Invalid recommendation'); // if not reccomendation give error
    if (!data.explanation || data.explanation.length < 10) throw new Error('Explanation too short'); // if notexplanation / short explanation give error
}

export async function vendorAssessment(vendor) {
    const openai = getOpenAIClient(); // now the open api can be called
    // designing the prompt for the model
    const prompt = `
You are an enterprise security risk assessment agent.

INTERNAL POLICIES:
${policies}

RISK THRESHOLDS:
${JSON.stringify(thresholds, null, 2)}

VENDOR RESPONSES:
${JSON.stringify(vendor, null, 2)}

TASK:
1. Assess the vendor's security and compliance risk.
2. Assign risk_level: LOW, MEDIUM, or HIGH.
3. Provide explanation with specific reasoning.
4. Recommend: Auto-approve, Request clarification, or Escalate to security team.

Respond ONLY in valid JSON with: risk_level, explanation, recommendation
    `;

    try { // try for error catching
        const response = await openai.chat.completions.create({ // response is the response of the gpt-40-mini model to the prompt
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0 // reduce randomness
        });

        let content = response.choices[0].message.content; // take best response
        console.log("raw ai response: ", content); // debugging

        let extractedJson = null;
        
        // try to find JSON within markdown blocks from response (multiple variations)
        const patterns = [
            /```(?:json|JSON)?\s*([\s\S]*?)\s*```/,  // standard markdown block
            /```\s*([\s\S]*?)\s*```/,               // generic code block
            /\{[\s\S]*\}/                           // irect JSON object
        ];
        
        for (const pattern of patterns) { // go through the extraction patterns
            const match = content.match(pattern);
            if (match) {
                extractedJson = match[1].trim(); // extract the json
                break;
            }
        }
        
        if (!extractedJson) {
            throw new Error('No JSON found in response'); // if no json extracted throw error
        }
        
        console.log("Extracted JSON string:", extractedJson); // debugging

        const parsed = JSON.parse(extractedJson); // now we parse the json string to js objects
        validateSchema(parsed); // validate extracted JSON response against strict output schema from earlier

        // if no error we continue
        
        // example primitive confidence scoring
        const confidence = Math.round( 
            (Math.min(parsed.explanation.length / 200, 1) * 0.6 +  // 0 - 1 number for length * 60% (can get up to 60% score for length output)
             (parsed.explanation.toLowerCase().includes('vendor') ? 0.4 : 0)) * 100 // can only get the lasr 40% on if it includes the word vendor or not
        );

        return { // return the parsed data
            ...parsed,
            confidence_score: confidence,
            timestamp: new Date().toISOString(), // current date time
            validation_passed: true
        };

    } catch (error) { // catch an error 
        console.error("Error in vendor assessment:", error);
        return {
            risk_level: "HIGH", // safe default values for human review
            explanation: `ERROR: ${error.message}. Defaulting to HIGH risk.`,
            recommendation: "Escalate to security team",
            confidence_score: 0,
            timestamp: new Date().toISOString(),
            validation_passed: false
        };
    }
}