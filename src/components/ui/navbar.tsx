"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Phone,
  Map,
  FileText,
  Building,
  HelpCircle,
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

export function Navbar() {
  const { open: sidebarOpen } = useSidebar();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="bg-background border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-2 sm:px-3 lg:px-4">
        {" "}
        {/* Reduced padding here */}
        <div className="flex items-center justify-between h-12">
          {" "}
          {/* Reduced height here */}
          {/* Logo and Brand */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-xl font-semibold text-primary">
              ChatMate
            </Link>
          </div>
          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-2">
              {" "}
              {/* Reduced spacing here */}
              {/* Customer Care */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center text-xs">
                    {" "}
                    {/* Reduced font size here */}
                    <Phone className="mr-1 h-3 w-3" /> {/* Reduced icon size */}
                    Customer Care
                    <ChevronDown className="ml-0.5 h-3 w-3" />{" "}
                    {/* Reduced icon size */}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {" "}
                  {/* Reduced width here */}
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
                  <Button variant="ghost" className="flex items-center text-xs">
                    {" "}
                    {/* Reduced font size here */}
                    <HelpCircle className="mr-1 h-3 w-3" />{" "}
                    {/* Reduced icon size */}
                    Useful Links
                    <ChevronDown className="ml-0.5 h-3 w-3" />{" "}
                    {/* Reduced icon size */}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {" "}
                  {/* Reduced width here */}
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
                  <Button variant="ghost" className="flex items-center text-xs">
                    {" "}
                    {/* Reduced font size here */}
                    <FileText className="mr-1 h-3 w-3" />{" "}
                    {/* Reduced icon size */}
                    Policies
                    <ChevronDown className="ml-0.5 h-3 w-3" />{" "}
                    {/* Reduced icon size */}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {" "}
                  {/* Reduced width here */}
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
                  <Button variant="ghost" className="flex items-center text-xs">
                    {" "}
                    {/* Reduced font size here */}
                    <Building className="mr-1 h-3 w-3" />{" "}
                    {/* Reduced icon size */}
                    Offices
                    <ChevronDown className="ml-0.5 h-3 w-3" />{" "}
                    {/* Reduced icon size */}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  {" "}
                  {/* Reduced width here */}
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
      </div>
      {/* Mobile menu, show/hide based on menu state */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-1 pt-1 pb-2 space-y-0.5 sm:px-1">
            <button className="w-full text-left block px-1 py-1 rounded-md text-xs font-medium hover:bg-primary hover:text-primary-foreground">
              Customer Care
            </button>
            <button className="w-full text-left block px-1 py-1 rounded-md text-xs font-medium hover:bg-primary hover:text-primary-foreground">
              Useful Links
            </button>
            <button className="w-full text-left block px-1 py-1 rounded-md text-xs font-medium hover:bg-primary hover:text-primary-foreground">
              Policies
            </button>
            <button className="w-full text-left block px-1 py-1 rounded-md text-xs font-medium hover:bg-primary hover:text-primary-foreground">
              Offices
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
