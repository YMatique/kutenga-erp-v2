declare module 'jsbarcode' {
    type Options = {
        format?: string;
        width?: number;
        height?: number;
        displayValue?: boolean;
        fontSize?: number;
        margin?: number;
        textMargin?: number;
        background?: string;
        lineColor?: string;
    };

    export default function JsBarcode(element: SVGElement | HTMLElement | string, text: string, options?: Options): void;
}
