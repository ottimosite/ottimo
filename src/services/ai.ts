export interface AnalysisInput { title:string; summary:string; category:string; impact:string }
export interface AIAnalysis { explanation:string; nextStep:string }
export interface AIProvider { analyseIssue(input:AnalysisInput):Promise<AIAnalysis> }
export class MockAIProvider implements AIProvider { async analyseIssue(input:AnalysisInput){ return { explanation:`${input.title} matters because ${input.impact}`, nextStep:`Start with the smallest practical change that addresses the ${input.category} signal, then measure again.` } } }
