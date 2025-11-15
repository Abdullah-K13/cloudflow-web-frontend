//app/actions/data_actions.ts
"use server"
import { revalidatePath } from 'next/cache';

// Types
export interface Project {
  id: string;
  name: string;
  description: string;
  team: string;
  language: string;
  author: string;
  createdAt: string;
}

export interface Pipeline {
  id: string;
  name: string;
  description: string;
  project: string;
  language: string;
  mode: string;
  author: string;
  createdAt: string;
}

export interface Model {
  id: string;
  name: string;
  description: string;
  project: string;
  language: string;
  author: string;
  createdAt: string;
}

export type DataItem = Project | Pipeline | Model;

// Sample data - replace with actual database calls
const sampleData = {
  projects: [
    { id: '1', name: 'AWS', description: '', team: 'talhaahmed7412@g...', language: 'sql', author: 'TA', createdAt: '35 minutes ago' },
    { id: '2', name: 'Data Analytics', description: 'Advanced analytics project', team: 'analytics@company...', language: 'python', author: 'JD', createdAt: '2 hours ago' },
    { id: '3', name: 'ML Pipeline', description: 'Machine learning workflow', team: 'ml-team@company...', language: 'python', author: 'SM', createdAt: '1 day ago' }
  ] as Project[],
  pipelines: [
    { id: '1', name: 'ETL Pipeline', description: 'Data transformation pipeline', project: 'AWS', language: 'sql', mode: 'batch', author: 'TA', createdAt: '1 hour ago' },
    { id: '2', name: 'ML Training', description: 'Model training pipeline', project: 'ML Pipeline', language: 'python', mode: 'streaming', author: 'SM', createdAt: '3 hours ago' }
  ] as Pipeline[],
  models: [
    { id: '1', name: 'Prediction Model', description: 'Customer churn prediction', project: 'ML Pipeline', language: 'python', author: 'SM', createdAt: '2 days ago' },
    { id: '2', name: 'Classification Model', description: 'Text classification', project: 'Data Analytics', language: 'python', author: 'JD', createdAt: '1 week ago' }
  ] as Model[]
};

// Server Actions for Projects
export async function getProjects(search?: string): Promise<Project[]> {
  try {
    // Replace with actual API call or database query
    // const response = await fetch(`${process.env.API_BASE_URL}/projects${search ? `?search=${search}` : ''}`, {
    //   headers: {
    //     'Authorization': `Bearer ${process.env.API_TOKEN}`,
    //   },
    // });
    // const data = await response.json();
    // return data;

    let data = sampleData.projects;
    if (search) {
      data = data.filter(item => 
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(search.toLowerCase()))
      );
    }
    return data;
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    return [];
  }
}

export async function deleteProject(id: string): Promise<{ success: boolean; message?: string }> {
  try {
    // Replace with actual API call or database query
    // const response = await fetch(`${process.env.API_BASE_URL}/projects/${id}`, {
    //   method: 'DELETE',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.API_TOKEN}`,
    //   },
    // });
    
    // if (!response.ok) {
    //   throw new Error('Failed to delete project');
    // }
    
    console.log(`Deleting project with ID: ${id}`);
    revalidatePath('/data/projects');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete project:', error);
    return { success: false, message: 'Failed to delete project' };
  }
}

// Server Actions for Pipelines
export async function getPipelines(search?: string): Promise<Pipeline[]> {
  try {
    // Replace with actual API call or database query
    let data = sampleData.pipelines;
    if (search) {
      data = data.filter(item => 
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(search.toLowerCase()))
      );
    }
    return data;
  } catch (error) {
    console.error('Failed to fetch pipelines:', error);
    return [];
  }
}

export async function deletePipeline(id: string): Promise<{ success: boolean; message?: string }> {
  try {
    console.log(`Deleting pipeline with ID: ${id}`);
    revalidatePath('/data/pipelines');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete pipeline:', error);
    return { success: false, message: 'Failed to delete pipeline' };
  }
}
// Server Actions for Models
export async function getModels(search?: string): Promise<Model[]> {
  try {
    // Replace with actual API call or database query
    let data = sampleData.models;
    if (search) {
      data = data.filter(item => 
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(search.toLowerCase()))
      );
    }
    return data;
  } catch (error) {
    console.error('Failed to fetch models:', error);
    return [];
  }
}

export async function deleteModel(id: string): Promise<{ success: boolean; message?: string }> {
  try {
    console.log(`Deleting model with ID: ${id}`);
    revalidatePath('/data/models');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete model:', error);
    return { success: false, message: 'Failed to delete model' };
  }
}