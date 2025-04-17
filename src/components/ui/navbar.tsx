"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Phone,
  HelpCircle,
  FileText,
  Building,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import Image from 'next/image'; // Import Image component
import { Icons } from "@/components/icons";

import { cn } from "@/lib/utils"; // Import cn utility

// Define props interface for Navbar
interface NavbarProps {
  className?: string;
}

export function Navbar({ className }: NavbarProps) { // Accept className prop
  const { open: sidebarOpen } = useSidebar();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className={cn("bg-background border-b sticky top-0 z-50 h-14", className)}> {/* Use cn utility and set height to h-14 */}
      <div className="max-w-7xl mx-auto px-2 sm:px-3 lg:px-4 h-full flex items-center justify-between"> {/* Ensure content is vertically centered */}
        {/* Logo and Brand */}
        <div className="flex-shrink-0 flex items-center">
          <Link href="/" className="flex items-center">
            <Icons.shield className="mr-2 h-4 w-4 text-primary" />
            <span className="text-xl font-semibold text-primary">
              Luminous ChatMate
            </span>
          </Link>
        </div>
        {/* Desktop Navigation */}
        <div className="hidden md:block">
          <div className="ml-10 flex items-center space-x-2">
            {/* Customer Care */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center text-xs py-1">
                  <Phone className="mr-1 h-3 w-3" />
                  Customer Care
                  <ChevronDown className="ml-0.5 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Helpline Numbers</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <span className="font-medium">Power Backup &amp; Energy:</span>
                  <span className="ml-1">+91-8906008008</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span className="font-medium">Customer Care:</span>
                  <span className="ml-1">9999933039</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span className="font-medium">Energy Solutions:</span>
                  <span className="ml-1">9990299902</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <span className="font-medium">Email:</span>
                  <span className="ml-1">
                    energysolution@luminousindia.com
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span className="font-medium">Global:</span>
                  <span className="ml-1">sales@luminous-global.com</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Useful Links */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center text-xs py-1">
                  <HelpCircle className="mr-1 h-3 w-3" />
                  Useful Links
                  <ChevronDown className="ml-0.5 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>
                  <Link
                    href="https://www.luminousindia.com/load-calculator"
                    className="w-full text-xs"
                  >
                    Load Calculator
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link
                    href="https://www.luminousindia.com/store-locator"
                    className="w-full text-xs"
                  >
                    Store Locator
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link
                    href="https://distributor.luminousindia.com/"
                    className="w-full text-xs"
                  >
                    Seller Panel
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link
                    href="https://www.luminousindia.com/warranty-cards"
                    className="w-full text-xs"
                  >
                    Warranty Cards
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link
                    href="https://www.luminousindia.com/installation"
                    className="w-full text-xs"
                  >
                    Installation Help
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link
                    href="https://www.luminousindia.com/service-care-pack"
                    className="w-full text-xs"
                  >
                    Service Care Pack
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link
                    href="https://www.luminousindia.com/track-order"
                    className="w-full text-xs"
                  >
                    Track Order Status
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link
                    href="https://www.luminousindia.com/warranty-registration"
                    className="w-full text-xs"
                  >
                    Register a product
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link
                    href="https://www.luminousindia.com/service-center-locator"
                    className="w-full text-xs"
                  >
                    Service Center Locator
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Policies */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center text-xs py-1">
                  <FileText className="mr-1 h-3 w-3" />
                  Policies
                  <ChevronDown className="ml-0.5 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>
                  <Link
                    href="https://www.luminousindia.com/shipping-policy"
                    className="w-full text-xs"
                  >
                    Shipping &amp; Payments
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link
                    href="https://www.luminousindia.com/cancellation-return"
                    className="w-full text-xs"
                  >
                    Cancellation &amp; Returns
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link
                    href="https://www.luminousindia.com/terms-conditions"
                    className="w-full text-xs"
                  >
                    Terms &amp; Conditions
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link
                    href="https://www.luminousindia.com/terms-conditions-offers"
                    className="w-full text-xs"
                  >
                    Terms &amp; Conditions (Offers)
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link
                    href="https://www.luminousindia.com/privacy-policy"
                    className="w-full text-xs"
                  >
                    Privacy Policy
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link
                    href="https://www.luminousindia.com/bulk-order"
                    className="w-full text-xs"
                  >
                    Bulk Orders
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Offices */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center text-xs py-1">
                  <Building className="mr-1 h-3 w-3" />
                  Offices
                  <ChevronDown className="ml-0.5 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel>Our Locations</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex-col items-start">
                  <span className="font-medium">Head Office</span>
                  <span className="text-sm text-muted-foreground">
                    Luminous Power Technologies Pvt. Ltd. Plot No. 150, Sector 44,
                    Gurgaon, Haryana - 122003
                  </span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex-col items-start">
                  <span className="font-medium">Registered Office</span>
                  <span className="text-sm text-muted-foreground">
                    C-56, Mayapuri Industrial Area, Phase- II, Mayapuri, New Delhi
                    110064
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {/* Mobile menu button */}
        <div className="md:hidden flex items-center">
          <button
            onClick={toggleMobileMenu}
            className="inline-flex items-center justify-center p-1 rounded-md text-primary hover:text-primary-foreground hover:bg-primary focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            aria-expanded="false"
          >
            <span className="sr-only">Open main menu</span>
            {/* Icon when menu is closed */}
            {!isMobileMenuOpen ? (
              <svg
                className="block h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            ) : (
              /* Icon when menu is open */
              <svg
                className="block h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}

// Removed default export as Navbar is likely used as a named import
// export default Navbar;
