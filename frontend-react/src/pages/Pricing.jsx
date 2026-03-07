import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Check, Zap, Building2, Rocket } from 'lucide-react';

const PLANS = [
    {
        name: 'Free',
        price: '$0',
        period: '/month',
        desc: 'Perfect for personal projects and testing.',
        icon: Zap,
        color: 'gray',
        cta: 'Start for Free',
        href: '/builder',
        features: [
            '100 charts / month',
            'Advanced chart (no layouts)',
            'PNG output',
            'Up to 1280×720 resolution',
            'Dark & light themes',
            'Community support',
        ],
        disabled: [],
    },
    {
        name: 'Pro',
        price: '$29',
        period: '/month',
        desc: 'For developers and trading tools.',
        icon: Rocket,
        color: 'violet',
        cta: 'Get Pro',
        href: '/builder',
        popular: true,
        features: [
            '5,000 charts / month',
            'Custom layout screenshots',
            'PNG + JPEG output',
            'Up to 1920×1080 resolution',
            'All timeframes & date ranges',
            'Priority rendering',
            'API key management',
            'Email support',
        ],
        disabled: [],
    },
    {
        name: 'Enterprise',
        price: 'Custom',
        period: '',
        desc: 'For high-volume platforms and teams.',
        icon: Building2,
        color: 'cyan',
        cta: 'Contact Us',
        href: 'mailto:hello@pixeltrade.app',
        features: [
            'Unlimited charts',
            'Dedicated rendering cluster',
            'SLA guarantee',
            'Custom domain',
            'Batch rendering API',
            'Webhook callbacks',
            'Dedicated Slack channel',
            'Custom contract',
        ],
        disabled: [],
    },
];

const colorMap = {
    gray: {
        border: 'border-gray-200 dark:border-white/10',
        glow: '',
        badge: '',
        btn: 'bg-black/10 dark:bg-white/10 hover:bg-white/15 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10',
        check: 'text-gray-600 dark:text-gray-400',
    },
    violet: {
        border: 'border-violet-500/40',
        glow: 'shadow-[0_0_60px_rgba(139,92,246,0.15)]',
        badge: true,
        btn: 'bg-gradient-to-r from-violet-600 to-cyan-600 text-gray-900 dark:text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]',
        check: 'text-violet-400',
    },
    cyan: {
        border: 'border-cyan-500/30',
        glow: '',
        badge: '',
        btn: 'bg-black/10 dark:bg-white/10 hover:bg-white/15 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10',
        check: 'text-cyan-400',
    },
};

export default function Pricing() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-semibold mb-4">
                    Simple Pricing
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
                    Pay only for what you use
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg max-w-xl mx-auto">
                    Start free. Scale as you grow. No surprise bills.
                </p>
            </motion.div>

            {/* Plans */}
            <div className="grid md:grid-cols-3 gap-6 items-start">
                {PLANS.map((plan, i) => {
                    const c = colorMap[plan.color];
                    const Icon = plan.icon;
                    return (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`relative rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border ${c.border} ${c.glow} p-7 flex flex-col`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                                    <span className="px-4 py-1 bg-gradient-to-r from-violet-600 to-cyan-600 text-gray-900 dark:text-white text-xs font-bold rounded-full shadow-lg whitespace-nowrap">
                                        Most Popular
                                    </span>
                                </div>
                            )}

                            <div className="flex items-center gap-3 mb-5">
                                <div className={`p-2.5 rounded-xl ${plan.color === 'violet' ? 'bg-violet-500/20' : plan.color === 'cyan' ? 'bg-cyan-500/20' : 'bg-black/5 dark:bg-white/5'}`}>
                                    <Icon className={`w-5 h-5 ${plan.color === 'violet' ? 'text-violet-400' : plan.color === 'cyan' ? 'text-cyan-400' : 'text-gray-600 dark:text-gray-400'}`} />
                                </div>
                                <div>
                                    <h2 className="font-bold text-gray-900 dark:text-white">{plan.name}</h2>
                                    <p className="text-xs text-gray-500 dark:text-gray-500">{plan.desc}</p>
                                </div>
                            </div>

                            <div className="mb-6">
                                <span className="text-4xl font-black text-gray-900 dark:text-white">{plan.price}</span>
                                {plan.period && <span className="text-gray-500 dark:text-gray-500 ml-1">{plan.period}</span>}
                            </div>

                            <ul className="space-y-2.5 mb-8 flex-grow">
                                {plan.features.map(f => (
                                    <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                                        <Check className={`w-4 h-4 mt-0.5 shrink-0 ${c.check}`} />
                                        {f}
                                    </li>
                                ))}
                            </ul>

                            {plan.href?.startsWith('mailto') ? (
                                <a href={plan.href}
                                    className={`w-full py-3 rounded-xl font-bold text-sm text-center transition-all ${c.btn}`}>
                                    {plan.cta}
                                </a>
                            ) : (
                                <Link to={plan.href}
                                    className={`w-full py-3 rounded-xl font-bold text-sm text-center block transition-all ${c.btn}`}>
                                    {plan.cta}
                                </Link>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* FAQ teaser */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                className="mt-20 text-center">
                <p className="text-gray-500 dark:text-gray-500 text-sm">
                    Questions? <a href="mailto:hello@pixeltrade.app" className="text-violet-400 hover:text-violet-300 underline underline-offset-2">Contact us</a>. We respond within 24h.
                </p>
            </motion.div>
        </div>
    );
}
