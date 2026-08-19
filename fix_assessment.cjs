const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldAssessment = `      You are an expert teacher. Generate an assessment based on the provided material.
      Difficulty: \${difficulty || 'Medium'}
      
      Tasks:
      Generate a structured Exam Question Paper following this formal outline:
      
      **Header**: (Course Name, Max Marks: 100, Time: 2 Hours)
      **Instructions**: General instructions for the students.
      
      **Section A: MCQs (Multiple Choice Questions)**
      - Generate 5 MCQs.
      
      **Section B: Short Theory**
      - Generate 3 short answer questions.
      
      **Section C: Long Problems/Essay**
      - Generate 2 detailed long answer questions.`;

const newAssessment = `      You are an expert teacher. Generate an assessment based on the provided material.
      Difficulty: \${difficulty || 'Medium'}
      
      CRITICAL INSTRUCTION: You MUST generate EXACTLY 50 unique questions for EACH section below. 
      Ensure that NO questions are repeated across or within sections. Provide exact answers and explanations for every single question. DO NOT add any extra questions beyond the 50 per section.

      Tasks:
      Generate a structured Exam Question Paper with Complete Solutions following this formal outline:
      
      **Header**: (Course Name, Max Marks: 100, Time: 2 Hours)
      **Instructions**: General instructions for the students.
      
      **Section A: MCQs (Multiple Choice Questions)**
      - Generate EXACTLY 50 MCQs. Include the correct answer and a brief explanation for each.
      
      **Section B: Short Theory**
      - Generate EXACTLY 50 short answer questions. Include a sample ideal answer for each.
      
      **Section C: Long Problems/Essay**
      - Generate EXACTLY 50 detailed long answer questions. Include a comprehensive step-by-step breakdown for each.`;

if (code.includes(oldAssessment)) {
    code = code.replace(oldAssessment, newAssessment);
    fs.writeFileSync('server.ts', code);
    console.log("Success");
} else {
    console.log("Not found");
}
