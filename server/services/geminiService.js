const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY not found. AI verification will be disabled.');
      this.genAI = null;
      return;
    }
    
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
    this.visionModel = this.genAI.getGenerativeModel({ model: "gemini-pro-vision" });
  }

  /**
   * Analyze school documents and data for verification
   */
  async analyzeSchoolDocuments(schoolData, documents = []) {
    if (!this.genAI) {
      return this._getFallbackResponse('School verification unavailable - AI service not configured');
    }

    try {
      const prompt = `
Analyze the following school registration data and documents for verification:

School Information:
- School Name: ${schoolData.schoolName}
- Registration Number: ${schoolData.registrationNumber}
- Address: ${schoolData.address.street}, ${schoolData.address.city}, ${schoolData.address.state} - ${schoolData.address.pincode}
- Contact Person: ${schoolData.contactPerson}
- Principal Name: ${schoolData.principalName}
- Phone: ${schoolData.phone}
- Documents Provided: ${documents.length} documents

Evaluate the following aspects:
1. Document authenticity indicators (registration certificates, affiliation proof)
2. Data consistency across all provided fields
3. Contact information validity patterns
4. Any red flags or anomalies in the information
5. Overall legitimacy assessment

Provide a JSON response with the following structure:
{
  "score": <number 0-100>,
  "documentAuthenticity": <number 0-100>,
  "dataConsistency": <number 0-100>,
  "anomalyDetection": "<description of any anomalies found>",
  "keyFindings": ["<finding1>", "<finding2>", "<finding3>"],
  "flags": ["<concern1>", "<concern2>"],
  "recommendations": "<recommendations for verification>"
}

Focus on realistic verification patterns and provide constructive analysis.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this._parseAIResponse(text, 'school');
    } catch (error) {
      console.error('Gemini API error in school analysis:', error);
      return this._getErrorResponse('School verification failed due to AI service error');
    }
  }

  /**
   * Analyze student profile and documents for verification
   */
  async analyzeStudentProfile(studentData, documents = []) {
    if (!this.genAI) {
      return this._getFallbackResponse('Student verification unavailable - AI service not configured');
    }

    try {
      const prompt = `
Analyze the following student profile for scholarship/sponsorship verification:

Student Information:
- Student Name: ${studentData.studentName}
- Grade: ${studentData.grade}
- Category: ${studentData.category}
- Achievement Details: ${studentData.achievementDetails}
- Financial Need: ₹${studentData.financialNeed}
- Documents Provided: ${documents.length} documents

Evaluate:
1. Achievement certificate validity indicators
2. Financial need reasonability for the grade/category
3. Profile consistency and completeness
4. Document authenticity patterns
5. Overall credibility assessment

Provide JSON response:
{
  "score": <number 0-100>,
  "credibilityScore": <number 0-100>,
  "documentValidity": <number 0-100>,
  "needAssessment": "<assessment of financial need reasonability>",
  "keyFindings": ["<finding1>", "<finding2>"],
  "flags": ["<concern1>", "<concern2>"],
  "recommendations": "<verification recommendations>"
}
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this._parseAIResponse(text, 'student');
    } catch (error) {
      console.error('Gemini API error in student analysis:', error);
      return this._getErrorResponse('Student verification failed due to AI service error');
    }
  }

  /**
   * Analyze infrastructure/funding request for verification
   */
  async analyzeInfrastructureRequest(requestData, documents = []) {
    if (!this.genAI) {
      return this._getFallbackResponse('Request verification unavailable - AI service not configured');
    }

    try {
      const prompt = `
Analyze the following infrastructure/funding request for verification:

Request Information:
- Title: ${requestData.title}
- Type: ${requestData.requestType}
- Category: ${requestData.category}
- Amount Needed: ₹${requestData.amountNeeded}
- Description: ${requestData.description}
- Supporting Documents: ${documents.length} documents

Evaluate:
1. Budget reasonability and market rate alignment
2. Necessity and urgency assessment
3. Supporting evidence quality and completeness
4. Risk of fraud or misrepresentation
5. Overall legitimacy of the request

Provide JSON response:
{
  "score": <number 0-100>,
  "legitimacyScore": <number 0-100>,
  "needValidation": <number 0-100>,
  "budgetReasonability": "<assessment of budget vs market rates>",
  "riskAssessment": "<risk analysis>",
  "keyFindings": ["<finding1>", "<finding2>"],
  "flags": ["<concern1>", "<concern2>"],
  "recommendations": "<verification recommendations>"
}
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this._parseAIResponse(text, 'request');
    } catch (error) {
      console.error('Gemini API error in request analysis:', error);
      return this._getErrorResponse('Request verification failed due to AI service error');
    }
  }

  /**
   * Analyze college credentials for verification
   */
  async analyzeCollegeCredentials(collegeData, documents = []) {
    if (!this.genAI) {
      return this._getFallbackResponse('College verification unavailable - AI service not configured');
    }

    try {
      const prompt = `
Analyze the following college credentials for verification:

College Information:
- College Name: ${collegeData.collegeName}
- Affiliation Number: ${collegeData.affiliationNumber}
- Address: ${collegeData.address.street}, ${collegeData.address.city}, ${collegeData.address.state} - ${collegeData.address.pincode}
- Contact Person: ${collegeData.contactPerson}
- Phone: ${collegeData.phone}
- Documents Provided: ${documents.length} documents

Evaluate:
1. Accreditation document validity indicators
2. Institutional registration authenticity
3. Affiliation number format and validity patterns
4. Overall institutional credibility assessment
5. Any red flags or concerns

Provide JSON response:
{
  "score": <number 0-100>,
  "institutionalCredibility": <number 0-100>,
  "accreditationValidity": <number 0-100>,
  "keyFindings": ["<finding1>", "<finding2>"],
  "flags": ["<concern1>", "<concern2>"],
  "recommendations": "<verification recommendations>"
}
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this._parseAIResponse(text, 'college');
    } catch (error) {
      console.error('Gemini API error in college analysis:', error);
      return this._getErrorResponse('College verification failed due to AI service error');
    }
  }

  /**
   * Parse AI response and extract JSON
   */
  _parseAIResponse(text, type) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Ensure score is within valid range
        if (parsed.score) {
          parsed.score = Math.max(0, Math.min(100, parsed.score));
        }
        
        return {
          success: true,
          data: parsed,
          confidence: parsed.score || 50,
          rawResponse: text
        };
      }
      
      // If no JSON found, create a basic response
      return this._getFallbackResponse(`AI analysis completed but response format was unexpected for ${type}`);
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return this._getFallbackResponse(`AI response parsing failed for ${type}`);
    }
  }

  /**
   * Get fallback response when AI is unavailable
   */
  _getFallbackResponse(message) {
    return {
      success: false,
      data: {
        score: 50, // Neutral score requiring manual review
        keyFindings: [message],
        flags: ['AI verification unavailable'],
        recommendations: 'Manual review required'
      },
      confidence: 0,
      requiresManualReview: true
    };
  }

  /**
   * Get error response for AI failures
   */
  _getErrorResponse(message) {
    return {
      success: false,
      data: {
        score: 0, // Low score due to error
        keyFindings: [message],
        flags: ['Verification system error'],
        recommendations: 'Manual review required due to system error'
      },
      confidence: 0,
      requiresManualReview: true,
      error: true
    };
  }

  /**
   * Check if AI service is available
   */
  isAvailable() {
    return this.genAI !== null;
  }

  /**
   * Get verification status based on AI score
   */
  getVerificationStatus(score) {
    if (score >= 80) {
      return 'verified'; // Auto-approved
    } else if (score >= 50) {
      return 'in_review'; // Manual review required
    } else {
      return 'rejected'; // Auto-rejected or flagged
    }
  }
}

module.exports = new GeminiService();