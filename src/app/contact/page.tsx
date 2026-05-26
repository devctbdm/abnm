"use client";

import { motion, Variants } from "motion/react";
import { useState } from "react";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  MessageCircle,
  Wifi,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
} as const;

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
} as const;

const floatingIcon = {
  animate: {
    y: [0, -8, 0],
    transition: { repeat: Infinity, duration: 2, ease: "easeInOut" as const },
  },
} satisfies Variants;

export default function ContactPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-linear-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 py-12 md:py-20">
      {/* Animated Background */}
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

      <div className="container relative z-10 mx-auto px-4">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="text-center mb-12"
        >
          <motion.div
            variants={fadeInUp}
            className="inline-flex items-center justify-center rounded-full bg-primary/10 p-3 mb-4"
          >
            <MessageCircle className="h-8 w-8 text-primary" />
          </motion.div>
          <motion.h1
            variants={fadeInUp}
            className="text-3xl font-bold md:text-4xl"
          >
            Get in Touch
          </motion.h1>
          <motion.p
            variants={fadeInUp}
            className="mt-3 text-muted-foreground max-w-2xl mx-auto"
          >
            Have questions? We're here to help. Reach out to our support team
            anytime.
          </motion.p>
        </motion.div>

        <div className="">
          {/* Left side: Contact Info + Hotline */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="space-y-6"
          >
            {/* Hotline Card (Super prominent) */}
            <motion.div variants={fadeInUp}>
              <Card className="border-2 border-primary/20 bg-linear-to-r from-primary/5 to-primary/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    📞 24/7 Hotline
                  </CardTitle>
                  <CardDescription>
                    Call us anytime – we're always ready to assist
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <motion.a
                    href="tel:01911059059"
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center justify-center gap-3 rounded-xl bg-primary p-4 text-white transition hover:bg-primary/90"
                  >
                    <Phone className="h-6 w-6" />
                    <span className="text-2xl font-bold tracking-wide">
                      01911 059059
                    </span>
                  </motion.a>
                  <p className="mt-3 text-center text-sm text-muted-foreground">
                    Available 24 hours, 7 days a week. Free consultation.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Other contact methods */}
            <motion.div variants={fadeInUp}>
              <Card>
                <CardHeader>
                  <CardTitle>Other Ways to Connect</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Email</p>
                      <a
                        href="mailto:mdminarulislamvip@gmail.com"
                        className="text-sm text-muted-foreground hover:text-primary"
                      >
                        mdminarulislamvip@gmail.com
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Office</p>
                      <p className="text-sm text-muted-foreground uppercase">
                        jibannagar,Shorif tower 6-flower lift-number (5)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Business Hours</p>
                      <p className="text-sm text-muted-foreground">
                        Sat - Thu: 9:00 AM – 8:00 PM
                        <br />
                        Friday: Closed
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Floating network icon */}
            <motion.div
              variants={floatingIcon}
              animate="animate"
              className="hidden md:block"
            >
              <Wifi className="mx-auto h-16 w-16 text-primary/20" />
            </motion.div>
          </motion.div>
        </div>

        {/* Map placeholder (optional) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12"
        >
          <Card>
            <CardContent className="">
              <div className="h-64 w-full rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1539.2692482191178!2d88.81376441557394!3d23.42364888045737!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39fed501dbe2187d%3A0x53ddfaf785f04b48!2sJibannagar%20Model%20Masjid%20%26%20Islamic%20Cultural%20Center!5e0!3m2!1sen!2sbd!4v1779793855182!5m2!1sen!2sbd"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
