"use client";

import Link from "next/link";
import { Cloud, Github, Twitter, Linkedin, Mail } from "lucide-react";

const Footer = () => {
  const footerLinks = [
    { name: "Templates", href: "/templates" },
    { name: "Documentation", href: "/docs" },
    { name: "Help", href: "/help" },
    { name: "Privacy", href: "/privacy" },
    { name: "Terms", href: "/terms" },
  ];

  const socialLinks = [
    { name: "GitHub", href: "https://github.com/cloudflow", icon: Github },
    { name: "Twitter", href: "https://twitter.com/cloudflow", icon: Twitter },
    { name: "LinkedIn", href: "https://linkedin.com/company/cloudflow", icon: Linkedin },
    { name: "Email", href: "mailto:hello@cloudflow.dev", icon: Mail },
  ];

  return (
    <footer className="bg-white border-t border-slate-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center space-y-6">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <Cloud className="h-6 w-6 text-primary group-hover:scale-110 transition-all" />
            <span className="text-lg font-semibold text-slate-900">CloudFlow</span>
          </Link>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm">
            {footerLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-slate-600 hover:text-primary transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Social Icons */}
          <div className="flex items-center space-x-5">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:opacity-80 transition-all"
                aria-label={social.name}
              >
                <social.icon className="h-5 w-5" />
              </a>
            ))}
          </div>

          {/* Copyright */}
          <p className="text-xs text-slate-500">
            © 2025 CloudFlow. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;