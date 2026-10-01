// QZ Tray não publica tipos; só declaramos o que usamos em lib/pos-printing.ts
declare module 'qz-tray' {
    const qz: {
        websocket: { isActive(): boolean; connect(options?: Record<string, unknown>): Promise<void> };
        configs: { create(printer: string, options?: Record<string, unknown>): unknown };
        print(config: unknown, data: unknown[]): Promise<void>;
    };
    export default qz;
}
