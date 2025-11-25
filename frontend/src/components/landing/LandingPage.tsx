import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileText, Upload, BarChart2, ShieldCheck, Activity, Clock } from 'lucide-react';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 relative overflow-hidden">
            {/* Background Texture - Dot Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] z-0 pointer-events-none" />

            {/* Ambient Background Blobs */}
            <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob z-0" />
            <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 z-0" />

            <main className="container mx-auto px-4 pt-20 pb-32 relative z-10">
                {/* Hero Section */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-12 mb-32">
                    <div className="lg:w-1/2 space-y-8">
                        <h1 className="text-6xl font-bold tracking-tight text-slate-900 leading-[1.1]">
                            Protecting Memories Through{' '}
                            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                Early Detection.
                            </span>
                        </h1>
                        <p className="text-xl text-slate-600 leading-relaxed max-w-2xl">
                            AlzAware uses advanced AI to analyze MRI scans and cognitive patterns, providing clinical-grade insights in seconds.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link href="/login">
                                <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/30 transition-all hover:scale-105">
                                    Start Free Assessment
                                </Button>
                            </Link>
                            <Link href="/about">
                                <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-2 border-slate-200 hover:border-blue-600 hover:bg-blue-50 hover:text-blue-600 transition-all">
                                    For Doctors
                                </Button>
                            </Link>
                        </div>

                        {/* Trust Indicators Strip */}
                        <div className="pt-8 flex items-center gap-8 border-t border-slate-200/60">
                            <div>
                                <p className="text-3xl font-bold text-slate-900">98%</p>
                                <p className="text-sm text-slate-500 font-medium">Prediction Accuracy</p>
                            </div>
                            <div className="w-px h-10 bg-slate-200" />
                            <div>
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="h-5 w-5 text-green-600" />
                                    <p className="text-lg font-bold text-slate-900">HIPAA</p>
                                </div>
                                <p className="text-sm text-slate-500 font-medium">Compliant Security</p>
                            </div>
                            <div className="w-px h-10 bg-slate-200" />
                            <div>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-blue-600" />
                                    <p className="text-lg font-bold text-slate-900">Real-time</p>
                                </div>
                                <p className="text-sm text-slate-500 font-medium">Analysis & Results</p>
                            </div>
                        </div>
                    </div>

                    {/* Abstract Brain Visualization */}
                    <div className="lg:w-1/2 relative flex items-center justify-center">
                        <div className="relative w-[500px] h-[500px]">
                            {/* Glowing Orb/Brain Effect */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full blur-3xl opacity-20 animate-pulse" />
                            <div className="absolute inset-10 bg-gradient-to-bl from-indigo-500 to-blue-400 rounded-full blur-2xl opacity-30 animate-blob" />

                            {/* Floating Cards simulating analysis */}
                            <div className="absolute top-0 right-10 bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/50 animate-bounce-slow">
                                <Activity className="h-8 w-8 text-blue-600" />
                                <p className="text-xs font-bold text-slate-600 mt-2">Neural Activity</p>
                                <div className="h-1 w-12 bg-blue-200 rounded-full mt-1">
                                    <div className="h-1 w-8 bg-blue-600 rounded-full" />
                                </div>
                            </div>

                            <div className="absolute bottom-20 left-0 bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/50 animate-bounce-slow delay-700">
                                <BarChart2 className="h-8 w-8 text-purple-600" />
                                <p className="text-xs font-bold text-slate-600 mt-2">Risk Analysis</p>
                                <p className="text-lg font-bold text-slate-900">Low Risk</p>
                            </div>

                            {/* Central Visual */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                {/* Using a simple SVG representation for the brain abstract */}
                                <svg viewBox="0 0 200 200" className="w-full h-full text-blue-600/10 drop-shadow-2xl">
                                    <path fill="currentColor" d="M45.7,-76.3C58.9,-69.3,69.1,-55.6,76.3,-41.2C83.5,-26.9,87.6,-11.8,85.8,2.6C84,17,76.2,30.7,66.4,42.6C56.7,54.5,45,64.6,31.7,71.5C18.4,78.4,3.5,82.1,-10.6,80.4C-24.7,78.7,-38,71.6,-49.6,62.3C-61.2,53,-71.1,41.5,-76.8,28.3C-82.5,15.1,-84,0.2,-79.6,-13.2C-75.2,-26.6,-64.9,-38.5,-53.3,-46.4C-41.7,-54.3,-28.8,-58.2,-16.3,-60.8C-3.8,-63.4,8.3,-64.7,21.5,-66.8" transform="translate(100 100)" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* How It Works Section */}
                <div className="text-center mb-20">
                    <h2 className="text-4xl font-bold text-slate-900 mb-4">How It Works</h2>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Our streamlined process makes early detection accessible and easy.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        {
                            step: "Step 1",
                            title: "Cognitive Assessment",
                            desc: "Complete a short, standardized cognitive test to provide additional data for our AI model.",
                            icon: <FileText className="h-10 w-10 text-blue-600" />
                        },
                        {
                            step: "Step 2",
                            title: "Upload MRI Scan",
                            desc: "Securely upload a patient's MRI brain scan. Our system accepts standard medical imaging formats.",
                            icon: <Upload className="h-10 w-10 text-purple-600" />
                        },
                        {
                            step: "Step 3",
                            title: "Get Results",
                            desc: "Receive a detailed report with the predicted stage of Alzheimer's and a confidence score.",
                            icon: <BarChart2 className="h-10 w-10 text-green-600" />
                        }
                    ].map((item, i) => (
                        <div key={i} className="group relative bg-white/70 backdrop-blur-lg border border-white/50 p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1">
                            <div className="absolute -top-4 left-8 bg-slate-900 text-white text-xs font-bold px-3 py-1 rounded-full">
                                {item.step}
                            </div>
                            <div className="mb-6 bg-blue-50 w-20 h-20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                {item.icon}
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-4">{item.title}</h3>
                            <p className="text-slate-600 leading-relaxed">
                                {item.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
