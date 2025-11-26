import React, { useState, useEffect } from 'react';

/**
 * Simple inline icon components (no external libraries)
 * They just render small text labels so layout stays consistent.
 */

const IconBase = ({ className = '', label }) => (
  <span
    className={className}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.7rem',
      fontWeight: 600,
      borderRadius: '999px',
      border: '1px solid currentColor',
      width: '1.25rem',
      height: '1.25rem',
    }}
    aria-hidden="true"
  >
    {label}
  </span>
);

const FileText = (props) => <IconBase {...props} label="FT" />;
const Loader2 = (props) => <IconBase {...props} label="⟳" />;
const CheckCircle = (props) => <IconBase {...props} label="✓" />;
const AlertCircle = (props) => <IconBase {...props} label="!" />;
const X = (props) => <IconBase {...props} label="×" />;
const Target = (props) => <IconBase {...props} label="T" />;
const Copy = (props) => <IconBase {...props} label="C" />;
const FolderOpen = (props) => <IconBase {...props} label="F" />;
const Briefcase = (props) => <IconBase {...props} label="B" />;
const Trash2 = (props) => <IconBase {...props} label="🗑" />;
const Upload = (props) => <IconBase {...props} label="U" />;
const Phone = (props) => <IconBase {...props} label="P" />;
const Mail = (props) => <IconBase {...props} label="M" />;

const App = () => {
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

  // Load saved projects
  useEffect(() => {
    try {
      const saved = localStorage.getItem('erg-projects');
      if (saved) setProjects(JSON.parse(saved));
    } catch (e) {
      console.error('Failed to load projects:', e);
      showToast('Failed to load saved projects', 'error');
    }
  }, []);

  // Save projects
  useEffect(() => {
    try {
      localStorage.setItem('erg-projects', JSON.stringify(projects));
    } catch (e) {
      console.error('Failed to save projects:', e);
      showToast('Storage limit reached. Please delete old projects.', 'error');
    }
  }, [projects]);

  // Load current project content into state
  useEffect(() => {
    if (currentProjectId) {
      const p = projects.find((x) => x.id === currentProjectId);
      if (p?.content) {
        setClientWebsite(p.content.clientWebsite || '');
        setJobBriefing(p.content.jobBriefing || '');
        setJobDescFile(p.content.jobDescFile || null);
        setLinkedinAd(p.content.linkedinAd || null);
        setCandidateBrief(p.content.candidateBrief || null);
        setEvp(p.content.evp || null);
        setPitch(p.content.pitch || null);
        setEmailBullets(p.content.emailBullets || null);
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

  // (Second load just in case; kept from original)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('erg-projects');
      if (saved) setProjects(JSON.parse(saved));
    } catch (e) {
      console.error('Failed to load projects:', e);
    }
  }, []);

  const createProject = () => {
    if (!newProjectName.trim()) return;
    const newP = {
      id: Date.now().toString(),
      name: newProjectName,
      createdAt: Date.now(),
      content: {},
    };
    setProjects([...projects, newP]);
    setCurrentProjectId(newP.id);
    setNewProjectName('');
    setShowModal(false);
    setMode('project');
  };

  /**
   * NOTE: This still points at Anthropic’s API but without auth headers.
   * In the browser this will *not* work until you:
   * - add the proper Authorization headers
   * - or proxy it via your own backend / serverless function.
   *
   * I’ve left it as-is to match your original behaviour.
   */
  const callAPI = async (prompt, isDocument = false, documentData = null, mediaType = null) => {
    const body = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [],
    };

    if (isDocument && documentData && mediaType) {
      body.messages.push({
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: documentData,
            },
          },
          {
            type: 'text',
            text: prompt,
          },
        ],
      });
    } else {
      body.messages.push({
        role: 'user',
        content: prompt,
      });
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API request failed: ${res.status}`);
    }
    const data = await res.json();
    return data.content[0].text;
  };

  const handleFileUpload = (e, setter) => {
    const file = e.target.files[0];
    if (!file) return;

    // 10MB limit
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      showToast('File too large. Maximum size is 10MB.', 'error');
      e.target.value = '';
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

    if (
      file.type === 'application/pdf' ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'application/msword'
    ) {
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
    try {
      const assets = `
CLIENT WEBSITE: ${clientWebsite || 'Not provided'}
JOB BRIEFING: ${jobBriefing || 'Not provided'}
JOB DESCRIPTION: ${jobDescFile?.content || 'Not provided'}`;

      // LinkedIn Ad
      const linkedinPrompt = `Create THE BEST LinkedIn job ad:
${assets}

CRITICAL: DO NOT include the company name or sector. Keep it anonymous and generic.

RULES: Max 3 lines per para, strong hook first 2-3 lines, no clichés, UK English, emojis (3-4), hashtags (3-5)
TONE: ${linkedinTone === 1 ? 'Formal' : linkedinTone === 2 ? 'Balanced' : 'Casual'}
Include: Hook, What You'll Do, What You'll Bring, Why Great, Soft Close

Keep the company anonymous - refer to them as "our client", "the team", "this organisation" etc.`;

      const adResult = await callAPI(linkedinPrompt);
      setLinkedinAd(adResult);

      // Candidate Brief
      const briefPrompt = `Create ${briefLength}-word candidate brief:
${assets}
TONE: ${briefTone === 1 ? 'Formal' : briefTone === 2 ? 'Professional' : 'Conversational'}
Cover: company, role, tech, team, growth, why it matters. Short paras, UK English.`;

      const briefResult = await callAPI(briefPrompt);
      setCandidateBrief(briefResult);

      // EVP
      const evpPrompt = `Employee Value Proposition (9 sections):
${assets}
LENGTH: ${evpLength === 1 ? 'Brief' : evpLength === 2 ? 'Standard' : 'Detailed'}
Sections: Tech Usage, Training, Career, Culture, Benefits, Challenges, Flexibility, Comms, Leadership`;

      const evpResult = await callAPI(evpPrompt);
      setEvp(evpResult);

      // Elevator Pitch
      const pitchPrompt = `60-second phone script:
${assets}
TONE: ${pitchTone === 1 ? 'Formal' : pitchTone === 2 ? 'Professional' : 'Casual'}
Natural conversation, UK English.`;

      const pitchResult = await callAPI(pitchPrompt);
      setPitch(pitchResult);

      // Email Bullets
      const emailPrompt = `8 email bullets for candidate:
${assets}
TONE: ${emailTone === 1 ? 'Professional' : emailTone === 2 ? 'Friendly' : 'Casual'}
NO company name, informal, one long sentence each (15-25 words)`;

      const emailResult = await callAPI(emailPrompt);
      setEmailBullets(emailResult);

      if (currentProjectId) {
        setProjects(
          projects.map((p) =>
            p.id === currentProjectId
              ? {
                  ...p,
                  content: {
                    clientWebsite,
                    jobBriefing,
                    jobDescFile,
                    linkedinAd: adResult,
                    candidateBrief: briefResult,
                    evp: evpResult,
                    pitch: pitchResult,
                    emailBullets: emailResult,
                  },
                }
              : p,
          ),
        );
      }

      showToast('All content generated', 'success');
    } catch (e) {
      showToast('Generation failed: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const analyzeCV = async () => {
    if (!cvFile) {
      showToast('No CV file uploaded', 'error');
      return;
    }

    if (!clientWebsite && !jobBriefing && !jobDescFile) {
      showToast('Please add job content first (Content tab)', 'error');
      return;
    }

    setLoading(true);
    showToast('Starting CV analysis...', 'info');

    try {
      const jobContext = `
CLIENT WEBSITE: ${clientWebsite || 'Not provided'}
JOB BRIEFING/TRANSCRIPT: ${jobBriefing || 'Not provided'}
JOB DESCRIPTION: ${jobDescFile?.content || 'Not provided'}`;

      const promptText = `Analyze this CV against the job requirements and provide a comprehensive assessment.

${jobContext}

Provide your response in this EXACT structure:

**MATCH SCORE: [0-100]/100**
Brief explanation of score (2-3 sentences)

**RECRUITER SUMMARY**
[Write a compelling 150-word paragraph selling this candidate to the hiring manager. Focus ONLY on strengths, achievements, and fit. Use humanised, enthusiastic language. No negative language whatsoever. Make them excited to interview this person.]

**TOP 5 TECHNICAL SKILLS ANALYSIS**
[Identify the 5 most important technical skills from the job requirements, then for each skill write ONE impactful sentence about the candidate's experience. Focus on quantifiable achievem]()
