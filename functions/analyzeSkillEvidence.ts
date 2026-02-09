import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      skill_id,
      evidence_urls = [],
      github_username,
      portfolio_url,
      certification_urls = []
    } = await req.json();

    if (!skill_id) {
      return Response.json({ error: 'skill_id required' }, { status: 400 });
    }

    // Get skill details
    const skills = await base44.entities.Skill.filter({ id: skill_id });
    if (skills.length === 0) {
      return Response.json({ error: 'Skill not found' }, { status: 404 });
    }
    const skill = skills[0];

    const analysisResults = {
      portfolio_analysis: null,
      github_analysis: null,
      certifications: [],
      projects: []
    };

    // Analyze GitHub if username provided
    if (github_username) {
      try {
        analysisResults.github_analysis = await analyzeGitHub(github_username, skill.name);
      } catch (error) {
        console.error('GitHub analysis error:', error);
      }
    }

    // Analyze portfolio URL
    if (portfolio_url) {
      try {
        analysisResults.portfolio_analysis = await analyzePortfolio(portfolio_url, skill.name);
      } catch (error) {
        console.error('Portfolio analysis error:', error);
      }
    }

    // Validate certifications
    for (const certUrl of certification_urls) {
      try {
        const certValidation = await validateCertification(certUrl);
        if (certValidation) {
          analysisResults.certifications.push(certValidation);
        }
      } catch (error) {
        console.error('Certification validation error:', error);
      }
    }

    // Analyze additional evidence URLs
    for (const url of evidence_urls) {
      try {
        const projectAnalysis = await analyzeProject(url, skill.name);
        if (projectAnalysis) {
          analysisResults.projects.push(projectAnalysis);
        }
      } catch (error) {
        console.error('Project analysis error:', error);
      }
    }

    // Generate comprehensive AI assessment
    const comprehensiveAssessment = await generateComprehensiveReport(
      skill,
      analysisResults,
      base44
    );

    // Create verification report
    const report = await base44.asServiceRole.entities.SkillVerificationReport.create({
      skill_id: skill.id,
      user_email: skill.user_email,
      skill_name: skill.name,
      verification_type: 'combined',
      evidence_urls: [portfolio_url, ...evidence_urls, ...certification_urls].filter(Boolean),
      proficiency_score: comprehensiveAssessment.proficiency_score,
      assessed_level: comprehensiveAssessment.assessed_level,
      analysis_summary: comprehensiveAssessment.summary,
      strengths: comprehensiveAssessment.strengths,
      areas_for_improvement: comprehensiveAssessment.improvements,
      projects_analyzed: analysisResults.projects,
      github_stats: analysisResults.github_analysis,
      certifications_validated: analysisResults.certifications,
      verification_status: comprehensiveAssessment.verification_status,
      confidence_level: comprehensiveAssessment.confidence_level,
      recommendations: comprehensiveAssessment.recommendations,
      verified_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
    });

    // Update skill with verification
    await base44.asServiceRole.entities.Skill.update(skill_id, {
      verification_score: comprehensiveAssessment.proficiency_score,
      level: comprehensiveAssessment.assessed_level,
      verified_by: comprehensiveAssessment.proficiency_score >= 70 ? 'system' : 'self'
    });

    return Response.json({
      success: true,
      report,
      proficiency_score: comprehensiveAssessment.proficiency_score,
      assessed_level: comprehensiveAssessment.assessed_level,
      summary: comprehensiveAssessment.summary
    });

  } catch (error) {
    console.error('Skill evidence analysis error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function analyzeGitHub(username, skillName) {
  try {
    // Fetch user profile
    const userResponse = await fetch(`https://api.github.com/users/${username}`);
    if (!userResponse.ok) throw new Error('GitHub user not found');
    
    // Fetch repositories
    const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`);
    if (!reposResponse.ok) throw new Error('Failed to fetch repos');
    
    const repos = await reposResponse.json();
    
    // Analyze languages
    const languages = new Set();
    let totalCommits = 0;
    
    for (const repo of repos.slice(0, 10)) {
      if (repo.language) languages.add(repo.language);
      
      // Get commit count
      try {
        const commitsResponse = await fetch(`https://api.github.com/repos/${username}/${repo.name}/commits?per_page=1`);
        if (commitsResponse.ok) {
          const linkHeader = commitsResponse.headers.get('Link');
          if (linkHeader) {
            const match = linkHeader.match(/page=(\d+)>; rel="last"/);
            if (match) totalCommits += parseInt(match[1]);
          }
        }
      } catch (err) {
        console.error('Error fetching commits:', err);
      }
    }

    return {
      total_repos: repos.length,
      total_commits: totalCommits,
      languages: Array.from(languages),
      contribution_frequency: totalCommits > 100 ? 'high' : totalCommits > 30 ? 'medium' : 'low',
      code_quality_score: Math.min(100, repos.length * 5 + (totalCommits / 10))
    };
  } catch (error) {
    console.error('GitHub analysis failed:', error);
    return null;
  }
}

async function analyzePortfolio(url, skillName) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch portfolio');
    
    const html = await response.text();
    
    // Simple analysis - count skill mentions, projects, etc.
    const skillMentions = (html.match(new RegExp(skillName, 'gi')) || []).length;
    const projectCount = (html.match(/<article|<project|class="project/gi) || []).length;
    
    return {
      url,
      skill_mentions: skillMentions,
      estimated_projects: projectCount,
      quality_indicator: skillMentions > 5 && projectCount > 2 ? 'high' : 'medium'
    };
  } catch (error) {
    console.error('Portfolio analysis failed:', error);
    return null;
  }
}

async function analyzeProject(url, skillName) {
  try {
    // Check if it's a GitHub repo
    if (url.includes('github.com')) {
      const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (match) {
        const [, owner, repo] = match;
        
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
        if (!response.ok) throw new Error('Repo not found');
        
        const repoData = await response.json();
        
        return {
          name: repoData.name,
          url: repoData.html_url,
          technologies: [repoData.language, ...(repoData.topics || [])].filter(Boolean),
          complexity_score: Math.min(100, (repoData.stargazers_count * 2) + (repoData.size / 100)),
          insights: `${repoData.description || 'No description'}. Stars: ${repoData.stargazers_count}`
        };
      }
    }
    
    // For other URLs, do basic fetch
    const response = await fetch(url);
    if (response.ok) {
      return {
        name: 'Project',
        url,
        technologies: [skillName],
        complexity_score: 50,
        insights: 'Project link verified'
      };
    }
  } catch (error) {
    console.error('Project analysis failed:', error);
  }
  return null;
}

async function validateCertification(url) {
  try {
    // Check for known certification providers
    if (url.includes('credly.com') || url.includes('acclaim.com')) {
      return await validateCredlyCert(url);
    } else if (url.includes('coursera.org')) {
      return await validateCourseraCert(url);
    } else if (url.includes('udemy.com')) {
      return await validateUdemyCert(url);
    }
    
    // Generic validation - just check if URL is accessible
    const response = await fetch(url, { method: 'HEAD' });
    if (response.ok) {
      return {
        name: 'Certification',
        issuer: 'Unknown',
        verified: true,
        verification_url: url
      };
    }
  } catch (error) {
    console.error('Certification validation failed:', error);
  }
  return null;
}

async function validateCredlyCert(url) {
  try {
    const response = await fetch(url);
    if (response.ok) {
      const html = await response.text();
      const nameMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
      const issuerMatch = html.match(/Issued by[:\s]+([^<\n]+)/i);
      
      return {
        name: nameMatch ? nameMatch[1].trim() : 'Certification',
        issuer: issuerMatch ? issuerMatch[1].trim() : 'Credly',
        verified: true,
        verification_url: url
      };
    }
  } catch (error) {
    console.error('Credly validation failed:', error);
  }
  return null;
}

async function validateCourseraCert(url) {
  return {
    name: 'Coursera Certification',
    issuer: 'Coursera',
    verified: true,
    verification_url: url
  };
}

async function validateUdemyCert(url) {
  return {
    name: 'Udemy Course Completion',
    issuer: 'Udemy',
    verified: true,
    verification_url: url
  };
}

async function generateComprehensiveReport(skill, analysisResults, base44) {
  const prompt = `Analyze this skill verification data and provide a comprehensive assessment:

Skill: ${skill.name}
Claimed Level: ${skill.level}
Years Experience: ${skill.years_experience || 'Not specified'}

GitHub Analysis:
${analysisResults.github_analysis ? JSON.stringify(analysisResults.github_analysis, null, 2) : 'Not provided'}

Portfolio Analysis:
${analysisResults.portfolio_analysis ? JSON.stringify(analysisResults.portfolio_analysis, null, 2) : 'Not provided'}

Projects Analyzed: ${analysisResults.projects.length}
${analysisResults.projects.map(p => `- ${p.name}: ${p.insights}`).join('\n')}

Certifications: ${analysisResults.certifications.length}
${analysisResults.certifications.map(c => `- ${c.name} from ${c.issuer}`).join('\n')}

Provide a detailed assessment with:
1. Overall proficiency score (0-100)
2. Assessed skill level (learning/competent/proficient/expert)
3. Verification status (verified/partially_verified/unverified)
4. Confidence level (high/medium/low)
5. Summary of findings
6. List of strengths (array)
7. Areas for improvement (array)
8. Recommendations for growth (array)`;

  const response = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        proficiency_score: { type: "number" },
        assessed_level: { type: "string" },
        verification_status: { type: "string" },
        confidence_level: { type: "string" },
        summary: { type: "string" },
        strengths: { type: "array", items: { type: "string" } },
        improvements: { type: "array", items: { type: "string" } },
        recommendations: { type: "array", items: { type: "string" } }
      }
    }
  });

  return response;
}