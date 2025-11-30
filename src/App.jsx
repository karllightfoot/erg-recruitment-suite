import React, { useState, useEffect } from 'react';
import { FileText, Loader2, CheckCircle, AlertCircle, X, Target, Copy, FolderOpen, Briefcase, Trash2, Upload, Phone, Mail, Download, UploadCloud } from 'lucide-react';

const ERGRecruitmentSuite = () => {
  const [mode, setMode] = useState('home');
  const [projects, setProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  
  const [clientWebsite, setClientWebsite] = useState('');
  const [jobBriefing, setJobBriefing] = useState('');
  const [jobDescFile, setJobDescFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [linkedinAd, setLinkedinAd] = useState(null);
  const [candidateBrief, setCandidateBrief] = useState(null);
  const [evp, setEvp] = useState(null);
  const [pitch, setPitch] = useState(null);
  const [emailBullets, setEmailBullets] = useState(null);
  const [cvFile, setCvFile] = useState(null);
  const [cvResult, setCvResult] = useState(null);
  const [analyzedCandidates, setAnalyzedCandidates] = useState([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [candidateBriefingNotes, setCandidateBriefingNotes] = useState('');
  const [briefingAssessment, setBriefingAssessment] = useState(null);
  const [techQuestions, setTechQuestions] = useState(null);
  const [interviewQs, setInterviewQs] = useState(null);
  const [interviewAgenda, setInterviewAgenda] = useState('');
  const [clientPrep, setClientPrep] = useState(null);
  const [candidatePrep, setCandidatePrep] = useState(null);
  const [toast, setToast] = useState(null);
  const [convertingPDF, setConvertingPDF] = useState(false);

  // Sliders
  const [linkedinTone, setLinkedinTone] = useState(2);
  const [briefLength, setBriefLength] = useState(1000);
  const [briefTone, setBriefTone] = useState(2);
  const [evpLength, setEvpLength] = useState(2);
  const [pitchTone, setPitchTone] = useState(2);
  const [emailTone, setEmailTone] = useState(3);

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem('erg-projects');
      if (saved) setProjects(JSON.parse(saved));
    } catch (e) {
      console.error('Failed to load projects:', e);
      showToast('Failed to load saved projects', 'error');
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('erg-projects', JSON.stringify(projects));
    } catch (e) {
      console.error('Failed to save projects:', e);
      showToast('Storage limit reached. Please delete old projects.', 'error');
    }
  }, [projects]);

  useEffect(() => {
    if (currentProjectId) {
      const p = projects.find(x => x.id === currentProjectId);
      if (p) {
        setClientWebsite(p.content?.clientWebsite || '');
        setJobBriefing(p.content?.jobBriefing || '');
        setJobDescFile(p.content?.jobDescFile || null);
        setLinkedinAd(p.content?.linkedinAd || null);
        setCandidateBrief(p.content?.candidateBrief || null);
        setEvp(p.content?.evp || null);
        setPitch(p.content?.pitch || null);
        setEmailBullets(p.content?.emailBullets || null);
        setCvResult(p.cvResult || null);
        setInterviewQs(p.interviewQs || null);
        setAnalyzedCandidates(p.analyzedCandidates || []);
        setTechQuestions(p.techQuestions || null);
        setInterviewAgenda(p.interviewAgenda || '');
        setClientPrep(p.clientPrep || null);
        setCandidatePrep(p.candidatePrep || null);
      }
    }
  }, [currentProjectId, projects]);

  // Auto-save current content to project when inputs change (but NOT during generation)
  useEffect(() => {
    if (currentProjectId && projects.length > 0 && !loading) {
      const currentProject = projects.find(p => p.id === currentProjectId);
      // Only update if content has actually changed
      const newContent = {
        clientWebsite,
        jobBriefing,
        jobDescFile,
        linkedinAd,
        candidateBrief,
        evp,
        pitch,
        emailBullets
      };
      
      const hasChanged = JSON.stringify(currentProject?.content) !== JSON.stringify(newContent);
      
      if (hasChanged) {
        setProjects(prevProjects => prevProjects.map(p => 
          p.id === currentProjectId ? {
            ...p,
            content: newContent
          } : p
        ));
      }
    }
  }, [currentProjectId, clientWebsite, jobBriefing, jobDescFile, linkedinAd, candidateBrief, evp, pitch, emailBullets, loading]);

  // Export all data to JSON file
  const exportAllData = () => {
    const data = {
      projects: projects,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `erg-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Data exported successfully', 'success');
  };

  // Import data from JSON file
  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.projects && Array.isArray(data.projects)) {
          setProjects(data.projects);
          localStorage.setItem('erg-projects', JSON.stringify(data.projects));
          showToast(`Imported ${data.projects.length} projects successfully`, 'success');
        } else {
          showToast('Invalid backup file format', 'error');
        }
      } catch (error) {
        showToast('Error importing data: ' + error.message, 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

// ✅ UPDATED: call Vercel serverless function instead of Anthropic directly
const callAPI = async (
  prompt,
  isDocument = false,
  documentData = null,
  mediaType = null,
  retries = 3
) => {
  // Build Claude "messages" array
  const messages = [];

  if (isDocument && documentData && mediaType) {
    // Document + prompt
    messages.push({
      role: "user",
      content: [
        {
          type: "document",
          source: {
            type: "base64",
            media_type: mediaType,
            data: documentData,
          },
        },
        {
          type: "text",
          text: prompt,
        },
      ],
    });
  } else {
    // Plain text prompt
    messages.push({
      role: "user",
      content: prompt,
    });
  }

  // Retry loop
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`API call attempt ${attempt}/${retries}`);
      
      // Call Vercel serverless function with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      const res = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errText = await res.text();
        console.error("Claude API error:", errText);
        throw new Error(`API request failed: ${res.status}`);
      }

      const data = await res.json();

      // Try to be tolerant of different response shapes
      let text;
      if (typeof data.text === "string") {
        text = data.text;
      } else if (Array.isArray(data.content)) {
        text = data.content.map((part) => part.text || "").join("\n");
      } else {
        text = JSON.stringify(data);
      }

      console.log(`API call attempt ${attempt} succeeded`);
      return text;
    } catch (error) {
      console.error(`API call attempt ${attempt} failed:`, error);
      
      // If this was the last attempt, throw the error
      if (attempt === retries) {
        throw new Error(`API call failed after ${retries} attempts: ${error.message}`);
      }
      
      // Wait before retrying (exponential backoff: 1s, 2s, 4s)
      const waitTime = Math.pow(2, attempt - 1) * 1000;
      console.log(`Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
};

  const createProject = () => {
    if (!newProjectName.trim()) return;
    const newP = {
      id: Date.now().toString(),
      name: newProjectName,
      createdAt: Date.now(),
      content: {}
    };
    setProjects([...projects, newP]);
    setCurrentProjectId(newP.id);
    setNewProjectName('');
    setShowModal(false);
    setMode('project');
  };

  const handleFileUpload = (e, setter) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      showToast('File too large. Maximum size is 10MB.', 'error');
      e.target.value = ''; // Clear the input
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target.result;
      setter({ fileName: file.name, content: content, type: file.type });
    };
    
    reader.onerror = () => {
      showToast('Failed to read file', 'error');
      reader.abort();
    };
    
    // Read as base64 for PDFs and Word docs, as text for plain text files
    if (file.type === 'application/pdf' || 
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.type === 'application/msword') {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  };

  const generateAll = async () => {
    if (!clientWebsite && !jobBriefing && !jobDescFile) {
      showToast('Add at least one input', 'error');
      return;
    }
    
    setLoading(true);
    let completedCount = 0;
    const totalSteps = 5;
    
    // Helper function to add delay between calls
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    try {
      const assets = `
CLIENT WEBSITE: ${clientWebsite || 'Not provided'}
JOB BRIEFING: ${jobBriefing || 'Not provided'}
JOB DESCRIPTION: ${jobDescFile?.content || 'Not provided'}`;

      // LinkedIn Ad
      showToast(`Generating LinkedIn Ad (1/${totalSteps})...`, 'info');
      const linkedinPrompt = `Create THE BEST LinkedIn job ad:
${assets}

CRITICAL: DO NOT include the company name or sector. Keep it anonymous and generic.

RULES: Max 3 lines per para, strong hook first 2-3 lines, no clichés, UK English, emojis (3-4), hashtags (3-5)
TONE: ${linkedinTone === 1 ? 'Formal' : linkedinTone === 2 ? 'Balanced' : 'Casual'}
Include: Hook, What You'll Do, What You'll Bring, Why Great, Soft Close

Keep the company anonymous - refer to them as "our client", "the team", "this organisation" etc.`;
      
      const adResult = await callAPI(linkedinPrompt);
      setLinkedinAd(adResult);
      completedCount++;
      await delay(2000); // 2 second delay

      // Candidate Brief
      showToast(`Generating Candidate Brief (2/${totalSteps})...`, 'info');
      const briefPrompt = `Create ${briefLength}-word candidate brief:
${assets}
TONE: ${briefTone === 1 ? 'Formal' : briefTone === 2 ? 'Professional' : 'Conversational'}
Cover: company, role, tech, team, growth, why it matters. Short paras, UK English.`;
      
      const briefResult = await callAPI(briefPrompt);
      setCandidateBrief(briefResult);
      completedCount++;
      await delay(2000); // 2 second delay

      // EVP
      showToast(`Generating EVP (3/${totalSteps})...`, 'info');
      const evpPrompt = `Employee Value Proposition (9 sections):
${assets}
LENGTH: ${evpLength === 1 ? 'Brief' : evpLength === 2 ? 'Standard' : 'Detailed'}
Sections: Tech Usage, Training, Career, Culture, Benefits, Challenges, Flexibility, Comms, Leadership`;
      
      const evpResult = await callAPI(evpPrompt);
      setEvp(evpResult);
      completedCount++;
      await delay(2000); // 2 second delay

      // Elevator Pitch
      showToast(`Generating Pitch (4/${totalSteps})...`, 'info');
      const pitchPrompt = `60-second phone script:
${assets}
TONE: ${pitchTone === 1 ? 'Formal' : pitchTone === 2 ? 'Professional' : 'Casual'}
Natural conversation, UK English.`;
      
      const pitchResult = await callAPI(pitchPrompt);
      setPitch(pitchResult);
      completedCount++;
      await delay(2000); // 2 second delay

      // Email Bullets
      showToast(`Generating Email (5/${totalSteps})...`, 'info');
      const emailPrompt = `8 email bullets for candidate:
${assets}
TONE: ${emailTone === 1 ? 'Professional' : emailTone === 2 ? 'Friendly' : 'Casual'}
NO company name, informal, one long sentence each (15-25 words)`;
      
      const emailResult = await callAPI(emailPrompt);
      setEmailBullets(emailResult);
      completedCount++;

      if (currentProjectId) {
        setProjects(projects.map(p => 
          p.id === currentProjectId ? {
            ...p,
            content: {
              clientWebsite, jobBriefing, jobDescFile,
              linkedinAd: adResult, candidateBrief: briefResult,
              evp: evpResult, pitch: pitchResult, emailBullets: emailResult
            }
          } : p
        ));
      }

      showToast('All content generated successfully!', 'success');
    } catch (e) {
      console.error('Generation error:', e);
      showToast(`Generation failed at step ${completedCount + 1}/${totalSteps}: ${e.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const analyzeCV = async () => {
    console.log('=== CV ANALYSIS START ===');
    console.log('cvFile:', cvFile);
    console.log('clientWebsite:', clientWebsite);
    console.log('jobBriefing:', jobBriefing);
    console.log('jobDescFile:', jobDescFile);
    
    if (!cvFile) {
      console.log('ERROR: No CV file');
      showToast('No CV file uploaded', 'error');
      return;
    }
    
    // Check if we have job context
    if (!clientWebsite && !jobBriefing && !jobDescFile) {
      console.log('ERROR: No job content');
      showToast('Please add job content first (Content tab)', 'error');
      return;
    }
    
    setLoading(true);
    showToast('Starting CV analysis...', 'info');
    
    try {
      console.log('Building job context...');
      const jobContext = `
CLIENT WEBSITE: ${clientWebsite || 'Not provided'}
JOB BRIEFING/TRANSCRIPT: ${jobBriefing || 'Not provided'}
JOB DESCRIPTION: ${jobDescFile?.content || 'Not provided'}`;

      console.log('Job context built, length:', jobContext.length);

      const promptText = `Analyze this CV against the job requirements and provide a comprehensive assessment.

${jobContext}

Provide your response in this EXACT structure:

**MATCH SCORE: [0-100]/100**
Brief explanation of score (2-3 sentences)

**RECRUITER SUMMARY**
[Write a compelling 150-word paragraph selling this candidate to the hiring manager. Focus ONLY on strengths, achievements, and fit. Use humanised, enthusiastic language. No negative language whatsoever. Make them excited to interview this person.]

**TOP 5 TECHNICAL SKILLS ANALYSIS**
[Identify the 5 most important technical skills from the job requirements, then for each skill write ONE impactful sentence about the candidate's experience. Focus on quantifiable achievements and impact, not just years of experience. Format as:]

1. [Skill Name]: [One sentence with impact/metrics]
2. [Skill Name]: [One sentence with impact/metrics]
3. [Skill Name]: [One sentence with impact/metrics]
4. [Skill Name]: [One sentence with impact/metrics]
5. [Skill Name]: [One sentence with impact/metrics]

**RED FLAGS (RECRUITER EYES ONLY)**
[List any technical skill gaps, missing requirements, or concerns about the candidate's fit for this specific role. Be direct and honest. If there are NO concerns, write "No significant technical concerns identified."]`;

      let result;
      // PDFs and Word docs can use document mode
      const isPDF = cvFile.type === 'application/pdf';
      const isWordDoc = cvFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                        cvFile.type === 'application/msword';
      
      console.log('File type:', cvFile.type);
      console.log('Is PDF?', isPDF);
      console.log('Is Word?', isWordDoc);
      console.log('File content exists?', !!cvFile.content);
      console.log('File content length:', cvFile.content?.length);

      if (isPDF || isWordDoc) {
        console.log('Processing as document (PDF or Word)...');
        // Extract base64 data from data URL
        if (!cvFile.content || !cvFile.content.includes(',')) {
          console.log('ERROR: Invalid base64 format');
          throw new Error('Invalid file content format');
        }
        const base64Data = cvFile.content.split(',')[1];
        console.log('Base64 extracted, length:', base64Data?.length);
        console.log('Calling API with document...');
        result = await callAPI(promptText, true, base64Data, cvFile.type);
        console.log('API call complete');
      } else {
        console.log('Processing as text file...');
        let textContent = cvFile.content;
        
        if (cvFile.content.startsWith('data:')) {
          throw new Error('Unable to process this file format. Please use PDF, Word (.docx), or TXT.');
        }
        
        const fullPrompt = `${promptText}

CV CONTENT:
${textContent}`;
        console.log('Full prompt length:', fullPrompt.length);
        console.log('Calling API with text...');
        result = await callAPI(fullPrompt, false);
        console.log('API call complete');
      }
      
      console.log('Result received, length:', result?.length);
      console.log('Setting cvResult state...');
      setCvResult(result);
      console.log('cvResult state set');
      
      // Add to analyzed candidates list
      console.log('Creating candidate record...');
      const candidateId = Date.now().toString();
      const newCandidate = {
        id: candidateId,
        fileName: cvFile.fileName,
        analyzedAt: Date.now(),
        analysis: result,
        cvData: cvFile
      };
      
      const updatedCandidates = [...analyzedCandidates, newCandidate];
      console.log('Updating candidates list, new count:', updatedCandidates.length);
      setAnalyzedCandidates(updatedCandidates);
      
      if (currentProjectId) {
        console.log('Updating project data...');
        setProjects(projects.map(p => 
          p.id === currentProjectId ? { 
            ...p, 
            cvResult: result,
            analyzedCandidates: updatedCandidates
          } : p
        ));
        console.log('Project data updated');
      }
      
      console.log('=== CV ANALYSIS SUCCESS ===');
      showToast('CV analyzed & added to candidates', 'success');
    } catch (e) {
      console.error('=== CV ANALYSIS ERROR ===');
      console.error('Error type:', e.name);
      console.error('Error message:', e.message);
      console.error('Error stack:', e.stack);
      showToast('CV analysis failed: ' + e.message, 'error');
    } finally {
      console.log('Setting loading to false...');
      setLoading(false);
      console.log('=== CV ANALYSIS END ===');
    }
  };

  useEffect(() => {
    if (selectedCandidateId) {
      const candidate = analyzedCandidates.find(c => c.id === selectedCandidateId);
      if (candidate) {
        setCandidateBriefingNotes(candidate.briefingNotes || '');
        setBriefingAssessment(candidate.briefingAssessment || null);
      }
    } else {
      setCandidateBriefingNotes('');
      setBriefingAssessment(null);
    }
  }, [selectedCandidateId, analyzedCandidates]);

  const generateTechQuestions = async () => {
    if (!clientWebsite && !jobBriefing && !jobDescFile) {
      showToast('Add job content first', 'error');
      return;
    }
    
    setLoading(true);
    try {
      const jobContext = `
CLIENT WEBSITE: ${clientWebsite || 'Not provided'}
JOB BRIEFING/TRANSCRIPT: ${jobBriefing || 'Not provided'}
JOB DESCRIPTION: ${jobDescFile?.content || 'Not provided'}`;

      const prompt = `Based on the job requirements, identify the 5 most important technical skills and create recruiter-friendly interview questions.

${jobContext}

For each of the 5 key technical skills:
1. Identify the skill
2. Write ONE recruiter-friendly question (mildly technical, not deeply technical)
3. The question should help draw out the candidate's relevance and experience with that skill

Format as:

**[SKILL 1 NAME]**
Question: [Recruiter-friendly question to assess this skill]

**[SKILL 2 NAME]**
Question: [Recruiter-friendly question to assess this skill]

... (continue for all 5 skills)

Make questions conversational and practical. Avoid overly technical jargon. Focus on real-world application and impact.`;

      const result = await callAPI(prompt, false);
      setTechQuestions(result);
      
      if (currentProjectId) {
        setProjects(projects.map(p => 
          p.id === currentProjectId ? { ...p, techQuestions: result } : p
        ));
      }
      
      showToast('Tech questions generated', 'success');
    } catch (e) {
      showToast('Generation failed: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const generateBriefingAssessment = async () => {
    if (!candidateBriefingNotes.trim()) return;
    
    const selectedCandidate = analyzedCandidates.find(c => c.id === selectedCandidateId);
    if (!selectedCandidate) return;
    
    setLoading(true);
    try {
      const jobContext = `
CLIENT WEBSITE: ${clientWebsite || 'Not provided'}
JOB BRIEFING/TRANSCRIPT: ${jobBriefing || 'Not provided'}
JOB DESCRIPTION: ${jobDescFile?.content || 'Not provided'}`;

      const prompt = `Create a comprehensive briefing assessment for this candidate.

JOB REQUIREMENTS:
${jobContext}

CANDIDATE CV ANALYSIS:
${selectedCandidate.analysis}

CANDIDATE JOB BRIEFING NOTES:
${candidateBriefingNotes}

Create a summary assessment that includes:

**CANDIDATE ENGAGEMENT & MOTIVATION**
[2-3 sentences on their interest level, understanding of the role, and motivation]

**TECHNICAL FIT ASSESSMENT**
[Paragraph assessing how their discussed experience aligns with the role requirements]

**CULTURAL & SOFT SKILLS FIT**
[2-3 sentences on communication style, team fit, working preferences]

**KEY STRENGTHS FOR THIS ROLE**
[3-4 bullet points of their strongest selling points]

**CONCERNS OR GAPS TO ADDRESS**
[Any concerns that emerged during the briefing, or write "No major concerns"]

**RECOMMENDATION**
[Clear recommendation: Proceed to client interview / Needs further assessment / Not a fit, with brief reasoning]`;

      const result = await callAPI(prompt, false);
      setBriefingAssessment(result);
      
      // Save to candidate record
      const updatedCandidates = analyzedCandidates.map(c => 
        c.id === selectedCandidateId 
          ? { ...c, briefingNotes: candidateBriefingNotes, briefingAssessment: result }
          : c
      );
      setAnalyzedCandidates(updatedCandidates);
      
      if (currentProjectId) {
        setProjects(projects.map(p => 
          p.id === currentProjectId ? { ...p, analyzedCandidates: updatedCandidates } : p
        ));
      }
      
      showToast('Briefing assessment generated', 'success');
    } catch (e) {
      showToast('Assessment failed: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    showToast('Copied', 'success');
  };

  const convertPDFToWord = async () => {
    if (!cvFile || cvFile.type !== 'application/pdf') {
      showToast('Only PDF files can be converted', 'error');
      return;
    }

    setConvertingPDF(true);
    try {
      // Extract base64 data from data URL
      const base64Data = cvFile.content.split(',')[1];
      
      const prompt = `Extract ALL text content from this PDF and format it cleanly for a Word document.

CRITICAL INSTRUCTIONS:
- Extract every single piece of text from the PDF
- Preserve the structure: headings, sections, bullet points
- Maintain professional CV formatting
- Remove any irrelevant metadata or headers/footers
- Format as clean, readable text ready for Word
- Use proper line breaks and spacing
- Keep all contact details, experience, education, skills sections

Output ONLY the formatted CV text, nothing else.`;

      const extractedText = await callAPI(prompt, true, base64Data, cvFile.type);
      
      // Create a blob with proper Word formatting
      const wordContent = `${extractedText}`;
      const blob = new Blob([wordContent], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = cvFile.fileName.replace('.pdf', '.doc');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showToast('CV converted to Word', 'success');
    } catch (e) {
      showToast('Conversion failed: ' + e.message, 'error');
    } finally {
      setConvertingPDF(false);
    }
  };

  const generateInterview = async () => {
    if (!interviewAgenda.trim()) {
      showToast('Please add interview agenda', 'error');
      return;
    }
    
    if (!clientWebsite && !jobBriefing && !jobDescFile) {
      showToast('Add job content first', 'error');
      return;
    }
    
    setLoading(true);
    try {
      const jobContext = `
CLIENT WEBSITE: ${clientWebsite || 'Not provided'}
JOB BRIEFING/TRANSCRIPT: ${jobBriefing || 'Not provided'}
JOB DESCRIPTION: ${jobDescFile?.content || 'Not provided'}`;

      // Part 2: Client Preparation (only if candidate briefing exists)
      let clientPrepResult = null;
      if (candidateBriefingNotes && selectedCandidateId) {
        const selectedCandidate = analyzedCandidates.find(c => c.id === selectedCandidateId);
        
        const clientPrepPrompt = `Create a client preparation email to help the hiring manager understand what this candidate is looking for.

CANDIDATE BRIEFING NOTES:
${candidateBriefingNotes}

CANDIDATE CV ANALYSIS:
${selectedCandidate?.analysis || 'Not available'}

Create 10 bullet points (one sentence each) describing what the candidate wants in their next opportunity:
- Type of company they're looking for
- Role characteristics they value
- Team environment preferences
- Growth and development goals
- Technical interests and focus areas
- Work style and culture fit
- Career motivations

CRITICAL RULES:
- Write in a warm, humanised tone as if you're personally introducing them
- ONLY include positive aspects that help sell the candidate
- Never mention weaknesses, gaps, or anything negative
- Frame everything as what excites them and what they bring
- Make the client excited to interview this person
- Each bullet should be ONE sentence, conversational and engaging

Format as clean bullet points ready to email to the client.`;

        clientPrepResult = await callAPI(clientPrepPrompt, false);
        setClientPrep(clientPrepResult);
      } else {
        setClientPrep(null);
      }

      // Part 3: Candidate Preparation
      const candidatePrepPrompt = `Create interview preparation guidance for the candidate.

JOB DETAILS:
${jobContext}

INTERVIEW AGENDA:
${interviewAgenda}

Create a humanised, practical guide covering:

**What to Expect:**
- Overview of the interview structure based on the agenda
- Who they'll meet and the interview format
- Approximate timing and flow

**Key Strengths to Demonstrate:**
- Match the candidate's strengths to the job requirements
- Specific examples and experiences to highlight
- Technical skills to emphasize
- Projects or achievements most relevant to this role

**How to Approach Each Section:**
- Brief tips for each part of the interview agenda
- What the interviewer is likely looking for
- How to frame responses effectively

CRITICAL RULES:
- Write in a warm, supportive, conversational tone
- Use bullet points for clarity
- Be practical and actionable
- Help them feel confident and prepared
- Make it feel like advice from a trusted recruiter friend
- Focus on what will make them stand out positively

Keep it concise but comprehensive - they should feel prepared but not overwhelmed.`;

      const candidatePrepResult = await callAPI(candidatePrepPrompt, false);
      setCandidatePrep(candidatePrepResult);

      // Save to project
      if (currentProjectId) {
        setProjects(projects.map(p => 
          p.id === currentProjectId ? {
            ...p,
            interviewAgenda,
            clientPrep: clientPrepResult,
            candidatePrep: candidatePrepResult
          } : p
        ));
      }

      showToast('Interview preparations generated', 'success');
    } catch (e) {
      showToast('Failed: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'home') {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Briefcase className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-2">ERG Recruitment Suite</h1>
            <p className="text-gray-600">Birmingham IT Recruitment Tools</p>
          </div>

          {/* Export/Import Buttons */}
          <div className="flex gap-4 mb-8 max-w-md mx-auto">
            <button
              onClick={exportAllData}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Export All Data
            </button>
            <label className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 cursor-pointer">
              <UploadCloud className="w-5 h-5" />
              Import Data
              <input
                type="file"
                accept=".json"
                onChange={importData}
                className="hidden"
              />
            </label>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="w-full max-w-md mx-auto block bg-white p-8 rounded-lg shadow hover:shadow-md border-2 hover:border-blue-500"
          >
            <FolderOpen className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">New Project</h3>
            <p className="text-gray-600 text-sm">Content, CV analysis, interview prep</p>
          </button>

          {projects.length > 0 && (
            <div className="mt-12">
              <h3 className="font-bold mb-4">Recent Projects</h3>
              {projects.map(p => (
                <div key={p.id} className="bg-white p-4 rounded-lg shadow mb-2 flex justify-between">
                  <button onClick={() => { setCurrentProjectId(p.id); setMode('project'); }} className="flex-1 text-left">
                    <h4 className="font-semibold">{p.name}</h4>
                    <p className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</p>
                  </button>
                  <button 
                    onClick={() => {
                      if (window.confirm(`Delete project "${p.name}"? This cannot be undone.`)) {
                        setProjects(projects.filter(x => x.id !== p.id));
                        showToast('Project deleted', 'success');
                      }
                    }} 
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">Create Project</h3>
              <input
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
                placeholder="Client/Vacancy Name"
                className="w-full px-3 py-2 border rounded mb-4"
                onKeyPress={e => e.key === 'Enter' && createProject()}
              />
              <div className="flex gap-3">
                <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border rounded">Cancel</button>
                <button onClick={createProject} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded">Create</button>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div className="fixed bottom-4 right-4">
            <div className={`${toast.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border rounded-lg p-4 shadow-lg flex items-center gap-3`}>
              {toast.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
              <span className="text-sm">{toast.msg}</span>
              <button onClick={() => setToast(null)}><X className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between mb-6">
          <h2 className="text-2xl font-bold">{projects.find(p => p.id === currentProjectId)?.name}</h2>
          <button onClick={() => setMode('home')} className="px-4 py-2 border rounded">Back</button>
        </div>

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b">
            {[
              { id: 'content', icon: Target, label: 'Content', color: 'blue' },
              { id: 'cv', icon: FileText, label: 'CV Analyser', color: 'green' },
              { id: 'candidate', icon: Briefcase, label: 'Candidate Interview', color: 'purple' },
              { id: 'interview', icon: Phone, label: 'Interview Prep', color: 'orange' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-4 px-6 font-medium ${activeTab === tab.id ? `border-b-2 border-${tab.color}-600 text-${tab.color}-600` : 'text-gray-600'}`}
              >
                <tab.icon className="w-5 h-5 inline mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'content' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold mb-4">Assets</h3>
              <input
                type="text"
                value={clientWebsite}
                onChange={e => setClientWebsite(e.target.value)}
                placeholder="Client Website URL"
                className="w-full px-3 py-2 border rounded mb-3"
              />
              <textarea
                value={jobBriefing}
                onChange={e => setJobBriefing(e.target.value)}
                placeholder="Job Briefing"
                className="w-full px-3 py-2 border rounded mb-3"
                rows="4"
              />
              <div className="border-2 border-dashed rounded p-6 text-center mb-4">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <input type="file" accept=".txt,.pdf,.doc,.docx" onChange={e => handleFileUpload(e, setJobDescFile)} className="hidden" id="jd" />
                <label htmlFor="jd" className="cursor-pointer text-blue-600">Upload Job Description</label>
                <p className="text-xs text-gray-500 mt-1">PDF, Word, or TXT</p>
                {jobDescFile && <p className="text-sm text-green-600 mt-2">✓ {jobDescFile.fileName}</p>}
              </div>
              <button
                onClick={generateAll}
                disabled={loading || (!clientWebsite && !jobBriefing && !jobDescFile)}
                className="w-full bg-blue-600 text-white py-3 rounded disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate All Content'}
              </button>
            </div>

            {linkedinAd && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between mb-4">
                  <h3 className="font-bold">LinkedIn Ad</h3>
                  <div className="flex gap-3">
                    <select value={linkedinTone} onChange={e => setLinkedinTone(Number(e.target.value))} className="border rounded px-2 py-1 text-sm">
                      <option value={1}>Formal</option>
                      <option value={2}>Balanced</option>
                      <option value={3}>Casual</option>
                    </select>
                    <button onClick={() => copy(linkedinAd)} className="text-blue-600"><Copy className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="bg-blue-50 rounded p-4">
                  <pre className="whitespace-pre-wrap text-sm">{linkedinAd}</pre>
                </div>
              </div>
            )}

            {candidateBrief && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between mb-4">
                  <h3 className="font-bold">Candidate Brief</h3>
                  <div className="flex gap-3">
                    <input type="number" value={briefLength} onChange={e => setBriefLength(Number(e.target.value))} className="border rounded px-2 py-1 w-20 text-sm" step="100" />
                    <select value={briefTone} onChange={e => setBriefTone(Number(e.target.value))} className="border rounded px-2 py-1 text-sm">
                      <option value={1}>Formal</option>
                      <option value={2}>Professional</option>
                      <option value={3}>Casual</option>
                    </select>
                    <button onClick={() => copy(candidateBrief)} className="text-purple-600"><Copy className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="bg-purple-50 rounded p-4">
                  <pre className="whitespace-pre-wrap text-sm">{candidateBrief}</pre>
                </div>
              </div>
            )}

            {evp && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between mb-4">
                  <h3 className="font-bold">Employee Value Proposition</h3>
                  <div className="flex gap-3">
                    <select value={evpLength} onChange={e => setEvpLength(Number(e.target.value))} className="border rounded px-2 py-1 text-sm">
                      <option value={1}>Brief</option>
                      <option value={2}>Standard</option>
                      <option value={3}>Detailed</option>
                    </select>
                    <button onClick={() => copy(evp)} className="text-indigo-600"><Copy className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="bg-indigo-50 rounded p-4">
                  <pre className="whitespace-pre-wrap text-sm">{evp}</pre>
                </div>
              </div>
            )}

            {pitch && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between mb-4">
                  <h3 className="font-bold flex items-center gap-2"><Phone className="w-5 h-5 text-orange-600" />60-Second Pitch</h3>
                  <div className="flex gap-3">
                    <select value={pitchTone} onChange={e => setPitchTone(Number(e.target.value))} className="border rounded px-2 py-1 text-sm">
                      <option value={1}>Formal</option>
                      <option value={2}>Professional</option>
                      <option value={3}>Casual</option>
                    </select>
                    <button onClick={() => copy(pitch)} className="text-orange-600"><Copy className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="bg-orange-50 rounded p-4">
                  <pre className="whitespace-pre-wrap text-sm">{pitch}</pre>
                </div>
              </div>
            )}

            {emailBullets && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between mb-4">
                  <h3 className="font-bold flex items-center gap-2"><Mail className="w-5 h-5 text-green-600" />8-Point Email</h3>
                  <div className="flex gap-3">
                    <select value={emailTone} onChange={e => setEmailTone(Number(e.target.value))} className="border rounded px-2 py-1 text-sm">
                      <option value={1}>Professional</option>
                      <option value={2}>Friendly</option>
                      <option value={3}>Casual</option>
                    </select>
                    <button onClick={() => copy(emailBullets)} className="text-green-600"><Copy className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="bg-green-50 rounded p-4">
                  <pre className="whitespace-pre-wrap text-sm">{emailBullets}</pre>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'cv' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold mb-4">CV Analysis</h3>
            
            {(!clientWebsite && !jobBriefing && !jobDescFile) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-semibold mb-1">Job context required</p>
                    <p>Add job details in the Content tab first for accurate CV scoring and analysis.</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Upload CV (PDF, Word, or TXT)</label>
              <input 
                type="file" 
                accept=".txt,.pdf,.doc,.docx" 
                onChange={e => handleFileUpload(e, setCvFile)} 
                className="w-full text-sm" 
              />
              <p className="text-xs text-gray-500 mt-1">Supports PDF, Word (.docx), and TXT files</p>
              {cvFile && <p className="text-xs text-gray-600 mt-2">File: {cvFile.fileName}</p>}
            </div>
            <button 
              onClick={analyzeCV} 
              disabled={!cvFile || loading || (!clientWebsite && !jobBriefing && !jobDescFile)} 
              className="w-full bg-green-600 text-white py-3 rounded disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing CV...
                </>
              ) : (
                'Analyze CV'
              )}
            </button>
            
            {cvResult && (
              <div className="mt-6 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    {cvFile?.type === 'application/pdf' && (
                      <button 
                        onClick={convertPDFToWord}
                        disabled={convertingPDF}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 text-sm"
                      >
                        {convertingPDF ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Converting...
                          </>
                        ) : (
                          <>
                            <FileText className="w-4 h-4" />
                            Convert to Word
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <button onClick={() => copy(cvResult)} className="text-green-600 hover:text-green-800 flex items-center gap-1 text-sm">
                    <Copy className="w-4 h-4" />
                    Copy All
                  </button>
                </div>
                
                <div className="prose prose-sm max-w-none">
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
                    <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">{cvResult}</pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'candidate' && (
          <div className="space-y-6">
            {/* Tech Questions Generator - Always at top */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold mb-4">Tech Questions Generator</h3>
              <p className="text-sm text-gray-600 mb-4">Recruiter-friendly questions based on job requirements (relevant for all candidates)</p>
              
              {(!clientWebsite && !jobBriefing && !jobDescFile) ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-semibold mb-1">Job context required</p>
                      <p>Add job details in the Content tab first to generate technical questions.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    onClick={generateTechQuestions}
                    disabled={loading}
                    className="w-full bg-purple-600 text-white py-3 rounded disabled:opacity-50 flex items-center justify-center gap-2 mb-4"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate Tech Questions'}
                  </button>
                  
                  {techQuestions && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex justify-between mb-3">
                        <span className="font-semibold">5 Key Technical Questions:</span>
                        <button onClick={() => copy(techQuestions)} className="text-purple-600 hover:text-purple-800">
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                      <pre className="whitespace-pre-wrap text-sm">{techQuestions}</pre>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Candidate Selection & Briefing Analysis */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold mb-4">Candidate-Specific Analysis</h3>
              
              {/* Candidate Dropdown */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Select Candidate</label>
                <select
                  value={selectedCandidateId || ''}
                  onChange={e => setSelectedCandidateId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">-- Select a candidate --</option>
                  {analyzedCandidates.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.fileName} (analyzed {new Date(c.analyzedAt).toLocaleDateString()})
                    </option>
                  ))}
                </select>
                
                {analyzedCandidates.length === 0 && (
                  <p className="text-xs text-gray-500 mt-2">No candidates analyzed yet. Upload CVs in the CV Analyser tab.</p>
                )}
              </div>

              {/* Candidate Briefing Box - only shows when candidate selected */}
              {selectedCandidateId && (
                <div>
                  <label className="block text-sm font-medium mb-2">Candidate Job Briefing</label>
                  <textarea
                    value={candidateBriefingNotes}
                    onChange={e => setCandidateBriefingNotes(e.target.value)}
                    placeholder="Paste your notes from the candidate job briefing call here..."
                    className="w-full px-3 py-2 border rounded-lg mb-4"
                    rows="6"
                  />
                  
                  <button
                    onClick={generateBriefingAssessment}
                    disabled={loading || !candidateBriefingNotes.trim()}
                    className="w-full bg-blue-600 text-white py-3 rounded disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate Briefing Assessment'}
                  </button>

                  {briefingAssessment && (
                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex justify-between mb-3">
                        <span className="font-semibold">Briefing Assessment:</span>
                        <button onClick={() => copy(briefingAssessment)} className="text-blue-600 hover:text-blue-800">
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                      <pre className="whitespace-pre-wrap text-sm">{briefingAssessment}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'interview' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold mb-4">Interview Preparation</h3>
            
            {/* Warning if no candidate briefing */}
            {(!candidateBriefingNotes || !selectedCandidateId) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-semibold mb-1">Candidate briefing required</p>
                    <p>Select a candidate and complete their briefing notes in the Candidate tab to generate Client Preparation.</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Part 1: Interview Agenda Input */}
            <div className="mb-6">
              <label className="block font-semibold mb-2">1. Interview Agenda</label>
              <textarea
                value={interviewAgenda}
                onChange={e => setInterviewAgenda(e.target.value)}
                placeholder="Paste the interview agenda here..."
                className="w-full px-3 py-2 border rounded-lg"
                rows="6"
              />
            </div>
            
            {/* Generate Button */}
            <button 
              onClick={generateInterview} 
              disabled={loading || !interviewAgenda.trim() || (!clientWebsite && !jobBriefing && !jobDescFile)}
              className="w-full bg-orange-600 text-white py-3 rounded disabled:opacity-50 mb-6 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate Interview Preparations'}
            </button>
            
            {/* Part 2: Client Preparation */}
            {clientPrep && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold">2. Client Preparation</h4>
                  <button onClick={() => copy(clientPrep)} className="text-orange-600 hover:text-orange-800 flex items-center gap-1 text-sm">
                    <Copy className="w-4 h-4" />
                    Copy
                  </button>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-3 italic">Email this to client before interview</p>
                  <pre className="whitespace-pre-wrap text-sm">{clientPrep}</pre>
                </div>
              </div>
            )}
            
            {/* Part 3: Candidate Preparation */}
            {candidatePrep && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold">3. Candidate Preparation</h4>
                  <button onClick={() => copy(candidatePrep)} className="text-orange-600 hover:text-orange-800 flex items-center gap-1 text-sm">
                    <Copy className="w-4 h-4" />
                    Copy
                  </button>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-3 italic">Send this to candidate before interview</p>
                  <pre className="whitespace-pre-wrap text-sm">{candidatePrep}</pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-4 right-4">
          <div className={`${toast.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border rounded-lg p-4 shadow-lg flex items-center gap-3`}>
            {toast.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
            <span className="text-sm">{toast.msg}</span>
            <button onClick={() => setToast(null)}><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ERGRecruitmentSuite;
