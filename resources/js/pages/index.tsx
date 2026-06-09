import { Head, Link } from '@inertiajs/react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function Landing() {
    return (
        <>
            {/* <Head title="Kutenga ERP" /> */}

            <div className="min-h-screen bg-white">

                {/* NAV */}
                <header className="border-b">
                    <div className="max-w-6xl mx-auto flex justify-between items-center p-4">

                        <div className="font-bold text-xl">
                            Kutenga ERP
                        </div>

                        <div className="flex gap-3">
                            <Link href="/login">
                                <Button variant="outline">
                                    Entrar
                                </Button>
                            </Link>

                            <Link href="/register">
                                <Button>
                                    Começar
                                </Button>
                            </Link>
                        </div>

                    </div>
                </header>

                {/* HERO */}
                <section className="max-w-6xl mx-auto px-6 py-20 text-center">

                    <Badge className="mb-4">
                        ERP Modular de Gestão Empresarial
                    </Badge>

                    <h1 className="text-5xl font-bold leading-tight">
                        Um sistema completo para gerir
                        <br />
                        vendas, stock e operações
                    </h1>

                    <p className="mt-6 text-gray-600 text-lg max-w-3xl mx-auto">
                        O Kutenga ERP integra POS, inventário, vendas,
                        transferências e relatórios num único sistema moderno,
                        escalável e preparado para empresas reais.
                    </p>

                    <div className="mt-8 flex justify-center gap-3">
                        <Link href="/register">
                            <Button size="lg">
                                Começar agora
                            </Button>
                        </Link>

                        <Link href="/login">
                            <Button variant="outline" size="lg">
                                Aceder ao sistema
                            </Button>
                        </Link>
                    </div>

                </section>

                {/* MODULES */}
                <section className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-6">

                    <Card className="p-6">
                        <h3 className="font-semibold text-lg">📚 Catálogo</h3>
                        <p className="text-sm text-gray-600 mt-2">
                            Gestão de produtos, preços, impostos e categorias.
                        </p>
                    </Card>

                    <Card className="p-6">
                        <h3 className="font-semibold text-lg">🛒 POS</h3>
                        <p className="text-sm text-gray-600 mt-2">
                            Vendas rápidas com emissão automática de faturas.
                        </p>
                    </Card>

                    <Card className="p-6">
                        <h3 className="font-semibold text-lg">📄 Cotações</h3>
                        <p className="text-sm text-gray-600 mt-2">
                            Criação de propostas comerciais antes da venda.
                        </p>
                    </Card>

                    <Card className="p-6">
                        <h3 className="font-semibold text-lg">🧾 Faturação</h3>
                        <p className="text-sm text-gray-600 mt-2">
                            Emissão de faturas com controlo de pagamentos.
                        </p>
                    </Card>

                    <Card className="p-6">
                        <h3 className="font-semibold text-lg">📦 Inventário</h3>
                        <p className="text-sm text-gray-600 mt-2">
                            Controlo de stock por armazém com rastreabilidade total.
                        </p>
                    </Card>

                    <Card className="p-6">
                        <h3 className="font-semibold text-lg">📊 Relatórios</h3>
                        <p className="text-sm text-gray-600 mt-2">
                            Análise de vendas, lucros e performance empresarial.
                        </p>
                    </Card>

                </section>

                {/* FLOW */}
                <section className="bg-gray-50 py-16">

                    <div className="max-w-6xl mx-auto px-6 text-center">

                        <h2 className="text-3xl font-bold mb-10">
                            Fluxo operacional integrado
                        </h2>

                        <div className="grid md:grid-cols-4 gap-6 text-sm">

                            <div>
                                <p className="font-semibold">1. Venda (POS)</p>
                                <p className="text-gray-600">Regista transações</p>
                            </div>

                            <div>
                                <p className="font-semibold">2. Stock</p>
                                <p className="text-gray-600">Dedução automática</p>
                            </div>

                            <div>
                                <p className="font-semibold">3. Transferência</p>
                                <p className="text-gray-600">Movimento entre armazéns</p>
                            </div>

                            <div>
                                <p className="font-semibold">4. Relatórios</p>
                                <p className="text-gray-600">Análise em tempo real</p>
                            </div>

                        </div>

                    </div>

                </section>

                {/* CTA */}
                <section className="max-w-6xl mx-auto px-6 py-20 text-center">

                    <h2 className="text-3xl font-bold">
                        Tudo o que a tua empresa precisa num só sistema
                    </h2>

                    <p className="text-gray-600 mt-3">
                        Começa a usar um ERP moderno, modular e escalável.
                    </p>

                    <div className="mt-6">
                        <Link href="/register">
                            <Button size="lg">
                                Criar conta
                            </Button>
                        </Link>
                    </div>

                </section>

                {/* FOOTER */}
                <footer className="border-t py-6 text-center text-sm text-gray-500">
                    © {new Date().getFullYear()} Kutenga ERP
                </footer>

            </div>
        </>
    )
}