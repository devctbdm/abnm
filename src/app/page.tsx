// src/app/page.tsx
"use client";

import { motion, useScroll, useTransform, Variants } from "motion/react";
import { useRef } from "react";
import Link from "next/link";
import {
  Zap,
  Shield,
  Users,
  ArrowRight,
  CheckCircle2,
  Smartphone,
  Tv,
  Gamepad2,
} from "lucide-react";

import { formatCurrency } from "@/lib/constants";

// ==================== Animation Variants ====================
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

function HeroSection() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section
      ref={containerRef}
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-br from-blue-50 via-white to-indigo-50 pt-16 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950"
    >
      {/* Animated background circles */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
        transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
        className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-200/30 blur-3xl dark:bg-blue-900/20"
      />
      <motion.div
        animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }}
        transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
        className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-indigo-200/30 blur-3xl dark:bg-indigo-900/20"
      />

      <motion.div
        style={{ y, opacity }}
        className="container relative z-10 mx-auto px-4 text-center"
      >
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="space-y-6"
        >
          <motion.div
            variants={fadeInUp}
            className="inline-block rounded-full bg-blue-100 px-4 py-1 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
          >
            ⚡ Lightning Fast Internet
          </motion.div>
          <motion.h1
            variants={fadeInUp}
            className="text-4xl font-extrabold tracking-tight sm:text-6xl md:text-7xl"
          >
            Unlimited Broadband for{" "}
            <span className="bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Home & Business
            </span>
          </motion.h1>
          <motion.p
            variants={fadeInUp}
            className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-300"
          >
            Experience ultra‑fast, reliable internet with 99.9% uptime. From
            streaming to gaming, we keep you connected.
          </motion.p>
          <motion.div
            variants={fadeInUp}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="#pricing"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Learn More
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: Zap,
      title: "Ultra Fast",
      desc: "Up to 1 Gbps speed for seamless 4K streaming and gaming.",
    },
    {
      icon: Shield,
      title: "Secure Network",
      desc: "Advanced security with encrypted connections.",
    },
    {
      icon: Users,
      title: "24/7 Support",
      desc: "Local customer service, always ready to help.",
    },
    {
      icon: Smartphone,
      title: "Easy Setup",
      desc: "Quick installation within 24 hours.",
    },
    {
      icon: Tv,
      title: "IPTV Ready",
      desc: "Bundle with TV channels for extra entertainment.",
    },
    {
      icon: Gamepad2,
      title: "Low Latency",
      desc: "Optimized for online gaming and video calls.",
    },
  ];

  return (
    <section id="features" className="py-20 md:py-28 bg-white dark:bg-gray-950">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="text-center mb-12"
        >
          <motion.h2
            variants={fadeInUp}
            className="text-3xl font-bold md:text-4xl"
          >
            Why Choose AB‑Network?
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="mt-3 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
          >
            We provide the best internet experience with cutting‑edge
            technology.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              variants={fadeInUp}
              whileHover="hover"
              initial="rest"
              animate="rest"
              className="rounded-2xl border bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
            >
              <feature.icon className="h-10 w-10 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold">{feature.title}</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function PricingSection() {
  const plans = [
    {
      name: "Starter",
      speed: "30 Mbps",
      price: "525",
      features: ["Unlimited data", "Free Wi‑Fi router", "24/7 support"],
    },
    {
      name: "Pro",
      speed: "100 Mbps",
      price: "800",
      features: [
        "Unlimited data",
        "Static IP",
        "Free installation",
        "Priority support",
      ],
      popular: true,
    },
    {
      name: "Ultra",
      speed: "1 Gbps",
      price: "1200",
      features: [
        "Symmetrical speed",
        "Dedicated line",
        "Business SLA",
        "Free TV box",
      ],
    },
  ];

  return (
    <section
      id="pricing"
      className="py-20 md:py-28 bg-gray-50 dark:bg-gray-900/50"
    >
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="text-center mb-12"
        >
          <motion.h2
            variants={fadeInUp}
            className="text-3xl font-bold md:text-4xl"
          >
            Simple, Transparent Pricing
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="mt-3 text-gray-600 dark:text-gray-400"
          >
            No hidden fees. Cancel anytime.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto"
        >
          {plans.map((plan, idx) => (
            <motion.div
              key={idx}
              variants={fadeInUp}
              whileHover={{ y: -10 }}
              className={`relative rounded-2xl border p-6 bg-white dark:bg-gray-950 shadow-sm transition-all ${
                plan.popular
                  ? "border-blue-500 ring-2 ring-blue-500/20"
                  : "border-gray-200 dark:border-gray-800"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-0.5 text-xs font-semibold text-white">
                  Most Popular
                </span>
              )}
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <p className="mt-1 text-3xl font-extrabold">
                {formatCurrency(Number(plan.price))}
                <span className="text-sm font-normal text-gray-500">
                  /month
                </span>
              </p>
              <p className="mt-2 text-sm text-gray-500">Up to {plan.speed}</p>
              <ul className="mt-6 space-y-2">
                {plan.features.map((feat, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    {feat}
                  </li>
                ))}
              </ul>
              <Link
                href="/contact"
                className="mt-6 block w-full rounded-full bg-blue-600 py-2 text-center text-white transition hover:bg-blue-700"
              >
                Choose Plan
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-20 bg-linear-to-r from-blue-600 to-indigo-600 text-white">
      <div className="container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold md:text-4xl">
            Ready for fast internet?
          </h2>
          <p className="mt-3 text-blue-100 max-w-xl mx-auto">
            Join thousands of happy customers who trust AB‑Network for their
            connectivity needs.
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-block rounded-full bg-white px-8 py-3 font-semibold text-blue-600 transition hover:bg-gray-100"
          >
            Get Connected Now
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// ==================== Main Page ====================
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <CTASection />
    </>
  );
}
