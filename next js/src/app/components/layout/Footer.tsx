import { Link } from "react-router-dom";
import { Cloud, Github, Twitter, Linkedin, Mail } from "lucide-react";

const Footer = () => {
  const footerSections = [
    {
      title: "Product",
      links: [
        { name: "Templates", href: "/templates" },
        { name: "Documentation", href: "/docs" },
        { name: "Help Center", href: "/help" },
        { name: "API Reference", href: "/docs/api" },
      ],
    },
    {
      title: "Company",
      links: [
        { name: "About", href: "/about" },
        { name: "Blog", href: "/blog" },
        { name: "Careers", href: "/careers" },
        { name: "Contact", href: "/contact" },
      ],
    },
    {
      title: "Resources",
      links: [
        { name: "Community", href: "/community" },
        { name: "Tutorials", href: "/tutorials" },
        { name: "Examples", href: "/examples" },
        { name: "Status", href: "/status" },
      ],
    },
    {
      title: "Legal",
      links: [
        { name: "Privacy Policy", href: "/privacy" },
        { name: "Terms of Service", href: "/terms" },
        { name: "Security", href: "/security" },
        { name: "Cookie Policy", href: "/cookies" },
      ],
    },
  ];

  const socialLinks = [
    { name: "GitHub", href: "https://github.com/cloudflow", icon: Github },
    { name: "Twitter", href: "https://twitter.com/cloudflow", icon: Twitter },
    { name: "LinkedIn", href: "https://linkedin.com/company/cloudflow", icon: Linkedin },
    { name: "Email", href: "mailto:hello@cloudflow.dev", icon: Mail },
  ];

  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Logo and Description */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <Cloud className="h-8 w-8 text-primary" />
              <span className="text-xl font-semibold text-foreground">CloudFlow</span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              Visualize, build, and deploy multi-cloud architectures with ease. 
              Drag-and-drop your way to scalable infrastructure.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-smooth"
                  aria-label={social.name}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section) => (
            <div key={section.title} className="lg:col-span-1">
              <h3 className="text-sm font-semibold text-foreground mb-4">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-smooth"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-muted-foreground">
              © 2025 CloudFlow. All rights reserved.
            </p>
            {/* <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <span>Built with ❤️ for developers</span>
            </div> */}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;