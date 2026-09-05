import React, { useState, useRef, useEffect } from 'react';
import { Send, X, AlertTriangle } from 'lucide-react';
import { useRecaps, useProducts } from '../hooks/useBusinessData';
import { askGrokAI, AI_PRIVACY_NOTICE } from '../api/grokService';

interface Message {
    sender: 'user' | 'bot';
    text: string;
}

const formatMessageText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, lineIdx) => {
        const parts = line.split(/(\*\*.*?\*\*)/g);
        const renderedLine = parts.map((part, partIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={partIdx} className="font-extrabold">{part.slice(2, -2)}</strong>;
            }
            return part;
        });
        return (
            <React.Fragment key={lineIdx}>
                {renderedLine}
                {lineIdx < lines.length - 1 && <br />}
            </React.Fragment>
        );
    });
};

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        { sender: 'bot', text: 'Halo! Saya Zura AI Assistant. Ada yang bisa saya bantu terkait pengelolaan toko hari ini?' }
    ]);
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Ambil data produk & rekap penjualan dari Firestore via shared hooks (React Query)
    const { data: products = [] } = useProducts();

    const { data: recaps = [] } = useRecaps();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen, isLoadingAI]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoadingAI) return;

        const userMessage = input.trim();
        setMessages((prev) => [...prev, { sender: 'user', text: userMessage }]);
        setInput('');
        setIsLoadingAI(true);

        try {
            const botResponse = await askGrokAI(userMessage, messages, { products, recaps });
            setMessages((prev) => [...prev, { sender: 'bot', text: botResponse }]);
        } catch (error) {
            console.error('Chatbot AI Error:', error);
            setMessages((prev) => [...prev, { sender: 'bot', text: 'Maaf, terjadi masalah koneksi dengan Zura AI. Silakan coba lagi.' }]);
        } finally {
            setIsLoadingAI(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-dmsans">
            {/* Widget Window Chatbot */}
            {isOpen && (
                <div className="mb-4 w-80 sm:w-96 h-[520px] bg-[#5F1E1E] rounded-3xl shadow-2xl border border-[#E8D3A7]/30 flex flex-col overflow-hidden transition-all duration-300">

                    {/* Header Zura */}
                    <div className="bg-[#3D1313] text-white px-5 py-4 flex items-center justify-between border-b border-[#E8D3A7]/20">
                        <div className="flex items-center gap-3">
                            {/* Logo dengan latar belakang hitam */}
                            <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center shadow-md p-1.5 border border-[#E8D3A7]/50">
                                <img
                                    src="/logo.png"
                                    alt="Zura Logo"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <div>
                                <h3 className="font-bold text-base text-white leading-tight">Tanya Zura AI</h3>
                                <span className="text-[10px] text-[#E8D3A7] font-semibold flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-[#E8D3A7] rounded-full animate-pulse"></span>
                                    Asisten Toko Online
                                </span>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="text-white/70 hover:text-white transition-colors p-1 rounded-lg focus:outline-none cursor-pointer"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Area Pesan Chat */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#5F1E1E]">

                        {/* Banner Peringatan */}
                        <div className="bg-[#FDE8C5] border border-[#E8D3A7] rounded-2xl p-3 flex items-start gap-2.5 text-[#5F1E1E]">
                            <AlertTriangle className="w-5 h-5 text-[#B26227] shrink-0 mt-0.5" />
                            <p className="text-[11px] leading-snug font-medium">
                                Saran AI bersifat analitis berdasarkan data input toko dan tidak menggantikan keputusan manajemen penuh bisnis Anda.
                            </p>
                        </div>

                        {/* Privacy Notice Data AI */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-start gap-2.5 text-[#E8D3A7]/80">
                            <p className="text-[9.5px] leading-snug font-medium">
                                {AI_PRIVACY_NOTICE}
                            </p>
                        </div>

                        {/* Bubble Chat */}
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${msg.sender === 'user'
                                        ? 'bg-[#3D1313] text-white border border-[#E8D3A7]/30 rounded-br-none shadow-md'
                                        : 'bg-white text-[#5F1E1E] rounded-bl-none shadow-md font-medium'
                                        }`}
                                >
                                    {formatMessageText(msg.text)}
                                </div>
                            </div>
                        ))}
                        {isLoadingAI && (
                            <div className="flex justify-start">
                                <div className="max-w-[82%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed bg-white text-[#5F1E1E] rounded-bl-none shadow-md font-medium flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-[#5F1E1E] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                    <span className="w-1.5 h-1.5 bg-[#5F1E1E] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                    <span className="w-1.5 h-1.5 bg-[#5F1E1E] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Form Input Pesan */}
                    <div className="p-4 bg-[#5F1E1E]">
                        <form onSubmit={handleSend} className="relative flex items-center">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ketik pertanyaan bisnis..."
                                className="w-full pl-4 pr-12 py-3 bg-white rounded-full text-xs text-gray-800 placeholder-gray-400 outline-none shadow-lg focus:ring-2 focus:ring-[#E8D3A7] transition-all"
                            />
                            <button
                                type="submit"
                                className="absolute right-2 p-2 text-[#5F1E1E] hover:text-[#3D1313] transition-colors focus:outline-none cursor-pointer"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </div>

                </div>
            )}

            {/* Floating Action Button (Selalu di Pojok Kanan Bawah) */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-14 h-14 bg-[#3D1313] text-white rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center border-2 border-[#E8D3A7] focus:outline-none cursor-pointer self-end"
                aria-label="Open Chatbot"
            >
                {isOpen ? (
                    <X className="w-6 h-6 text-[#E8D3A7]" />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-[#FFFF] flex items-center justify-center p-1 border border-[#E8D3A7]/50">
                        <img
                            src="/LogoChat.png"
                            alt="Zura AI Logo"
                            className="w-full h-full object-contain"
                        />
                    </div>
                )}
            </button>
        </div>
    );
}