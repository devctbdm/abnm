"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { Wifi, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
} as const;

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
} as const;

const floating = {
  animate: {
    y: [0, -10, 0],
    transition: { repeat: Infinity, duration: 3, ease: "easeInOut" as const },
  },
};

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950">
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
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="relative z-10 text-center"
      >
        {/* Floating Logo */}
        <motion.div
          variants={floating}
          animate="animate"
          className="mb-6 flex justify-center"
        >
          <div className="relative">
            <Wifi className="h-20 w-20 text-primary" strokeWidth={1.5} />
            <div className="absolute -right-2 -top-2 h-4 w-4 rounded-full bg-primary/60" />
          </div>
        </motion.div>

        {/* 404 Number */}
        <motion.h1
          variants={fadeInUp}
          className="text-8xl font-extrabold tracking-tighter sm:text-9xl md:text-[10rem]"
        >
          <span className="bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            404
          </span>
        </motion.h1>

        {/* Message */}
        <motion.h2
          variants={fadeInUp}
          className="mt-4 text-2xl font-bold md:text-3xl"
        >
          Page Not Found
        </motion.h2>
        <motion.p
          variants={fadeInUp}
          className="mt-2 max-w-md text-muted-foreground"
        >
          Oops! The page you're looking for doesn't exist or has been moved.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          variants={fadeInUp}
          className="mt-8 flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Link href="/">
            <Button variant="default" className="gap-2">
              <Home className="h-4 w-4" /> Go Home
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Login
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
