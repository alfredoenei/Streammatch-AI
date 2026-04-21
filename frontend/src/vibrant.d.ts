declare module 'node-vibrant/browser' {
    export interface Swatch {
        hex: string;
        rgb: [number, number, number];
        hsl: [number, number, number];
        population: number;
        titleTextColor: string;
        bodyTextColor: string;
    }

    export interface Palette {
        Vibrant?: Swatch;
        Muted?: Swatch;
        DarkVibrant?: Swatch;
        DarkMuted?: Swatch;
        LightVibrant?: Swatch;
        LightMuted?: Swatch;
        [key: string]: Swatch | undefined;
    }

    export class Vibrant {
        static from(src: string): {
            getPalette(): Promise<Palette>;
        };
    }
}
