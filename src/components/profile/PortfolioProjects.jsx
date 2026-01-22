import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, ExternalLink, Trash2, Edit, Sparkles, Loader2, Lightbulb } from "lucide-react";
import { toast } from "sonner";

export default function PortfolioProjects({ projects = [], onUpdate }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    technologies: '',
    link: '',
    ai_summary: '',
    suggested_skills: []
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      technologies: '',
      link: '',
      ai_summary: '',
      suggested_skills: []
    });
    setEditingProject(null);
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setFormData({
      ...project,
      technologies: Array.isArray(project.technologies) ? project.technologies.join(', ') : ''
    });
    setDialogOpen(true);
  };

  const generateAIInsights = async () => {
    if (!formData.description) {
      toast.error('Please add a project description first');
      return;
    }

    setGeneratingAI(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this portfolio project and provide insights:

Project Title: ${formData.title}
Description: ${formData.description}
Technologies: ${formData.technologies}

Provide:
1. A concise, professional summary (2-3 sentences) highlighting the key achievements and impact
2. A list of 5-8 relevant skills demonstrated by this project

Format as JSON.`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            skills: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      setFormData(prev => ({
        ...prev,
        ai_summary: response.summary,
        suggested_skills: response.skills
      }));
      toast.success('AI insights generated!');
    } catch (error) {
      console.error('Failed to generate AI insights:', error);
      toast.error('Failed to generate insights');
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.description) {
      toast.error('Title and description are required');
      return;
    }

    const techArray = formData.technologies
      .split(',')
      .map(t => t.trim())
      .filter(t => t);

    const newProject = {
      id: editingProject?.id || Date.now().toString(),
      title: formData.title,
      description: formData.description,
      technologies: techArray,
      link: formData.link,
      ai_summary: formData.ai_summary,
      suggested_skills: formData.suggested_skills
    };

    let updatedProjects;
    if (editingProject) {
      updatedProjects = projects.map(p => p.id === editingProject.id ? newProject : p);
    } else {
      updatedProjects = [...projects, newProject];
    }

    try {
      await base44.auth.updateMe({ portfolio_projects: updatedProjects });
      onUpdate(updatedProjects);
      toast.success(editingProject ? 'Project updated!' : 'Project added!');
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save project:', error);
      toast.error('Failed to save project');
    }
  };

  const handleDelete = async (projectId) => {
    const updatedProjects = projects.filter(p => p.id !== projectId);
    try {
      await base44.auth.updateMe({ portfolio_projects: updatedProjects });
      onUpdate(updatedProjects);
      toast.success('Project deleted');
    } catch (error) {
      console.error('Failed to delete project:', error);
      toast.error('Failed to delete project');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Portfolio Projects</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProject ? 'Edit Project' : 'Add Portfolio Project'}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div>
                  <Label>Project Title *</Label>
                  <Input
                    placeholder="E-commerce Platform"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Description *</Label>
                  <Textarea
                    placeholder="Describe what you built, the problem it solved, and your role..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                  />
                </div>

                <div>
                  <Label>Technologies Used</Label>
                  <Input
                    placeholder="React, Node.js, MongoDB, AWS (comma-separated)"
                    value={formData.technologies}
                    onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Project Link</Label>
                  <Input
                    placeholder="https://github.com/username/project"
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  />
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-base">AI-Generated Insights</Label>
                    <Button
                      onClick={generateAIInsights}
                      disabled={generatingAI || !formData.description}
                      variant="outline"
                      size="sm"
                    >
                      {generatingAI ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Insights
                        </>
                      )}
                    </Button>
                  </div>

                  {formData.ai_summary && (
                    <div className="space-y-3">
                      <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <p className="text-sm font-medium text-purple-900 mb-1 flex items-center gap-2">
                          <Lightbulb className="w-4 h-4" />
                          AI Summary
                        </p>
                        <p className="text-sm text-gray-700">{formData.ai_summary}</p>
                      </div>

                      {formData.suggested_skills?.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Suggested Skills:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {formData.suggested_skills.map((skill, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  {editingProject ? 'Update' : 'Add'} Project
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {projects.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No portfolio projects yet. Add your first project to showcase your work!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <div key={project.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{project.title}</h3>
                      {project.link && (
                        <a
                          href={project.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-700"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{project.description}</p>
                    
                    {project.ai_summary && (
                      <div className="mb-3 p-2 bg-purple-50 rounded border border-purple-100">
                        <p className="text-xs text-purple-900 font-medium mb-1 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          AI Summary
                        </p>
                        <p className="text-xs text-gray-700">{project.ai_summary}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 mb-2">
                      {project.technologies?.map((tech, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>

                    {project.suggested_skills?.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">Skills demonstrated:</p>
                        <div className="flex flex-wrap gap-1">
                          {project.suggested_skills.map((skill, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(project)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(project.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}