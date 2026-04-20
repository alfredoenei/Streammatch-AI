declare module 'node-vibrant/browser' {
    export class Vibrant {
        static from(src: string): {
            getPalette(): Promise<any>;
        };
    }
}
