export interface AnalyticsProvider { track(event:string, properties?:Record<string, unknown>):void }
export class NoopAnalyticsProvider implements AnalyticsProvider { track(){ /* intentionally silent */ } }
export class ConsoleAnalyticsProvider implements AnalyticsProvider { track(event:string, properties?:Record<string, unknown>){ if(import.meta.env.DEV) console.info('[Ottimo]',event,properties) } }
