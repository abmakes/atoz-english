import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Switch } from "../../components/ui/switch"
import { Textarea } from "../../components/ui/textarea"
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "../../components/ui/pagination"

export default function ButtonsPage() {
  // Define all the variants and sizes with proper typing
  const variants = ["default", "destructive", "outline", "secondary", "ghost", "link"] as const
  const sizes = ["default", "sm", "lg", "icon"] as const

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-8">UI Components Showcase</h1>
      
      {/* BUTTON COMPONENTS SECTION */}
      <div className="mb-20">
        <h2 className="text-3xl font-bold mb-8 border-b pb-2">Button Components</h2>
        
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Variants</h2>
          <div className="flex flex-wrap gap-4">
            {variants.map((variant) => (
              <Button
                key={variant}
                variant={variant}
                className="capitalize"
              >
                {variant}
              </Button>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Sizes</h2>
          <div className="flex flex-wrap gap-4 items-center">
            {sizes.map((size) => (
              <Button
                key={size}
                size={size}
                className={size === "icon" ? "flex-shrink-0" : "capitalize"}
              >
                {size === "icon" ? "A" : size}
              </Button>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">All Combinations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {variants.map((variant) => (
              <div key={variant} className="space-y-4">
                <h3 className="text-xl font-medium capitalize">{variant}</h3>
                <div className="flex flex-wrap gap-4 items-center">
                  {sizes.map((size) => (
                    <Button
                      key={`${variant}-${size}`}
                      variant={variant}
                      size={size}
                      className={size === "icon" ? "flex-shrink-0" : ""}
                    >
                      {size === "icon" ? "A" : `${size}`}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Disabled State</h2>
          <div className="flex flex-wrap gap-4">
            {variants.map((variant) => (
              <Button
                key={`${variant}-disabled`}
                variant={variant}
                disabled
                className="capitalize"
              >
                {variant}
              </Button>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">With Icons</h2>
          <div className="flex flex-wrap gap-4">
            <Button>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              Add Item
            </Button>
            
            <Button variant="outline">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download
            </Button>
            
            <Button variant="secondary">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 3H5a2 2 0 0 0-2 2v4" />
                <path d="M9 21H5a2 2 0 0 1-2-2v-4" />
                <path d="M19 3h-4" />
                <path d="M19 21h-4" />
                <path d="M5 12h14" />
              </svg>
              Filters
            </Button>
          </div>
        </section>
      </div>

      {/* OTHER UI COMPONENTS SECTION */}
      <div>
        <h2 className="text-3xl font-bold mb-8 border-b pb-2">Form & Content Components</h2>
        
        {/* Cards Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Simple Card */}
            <Card>
              <CardHeader>
                <CardTitle>Simple Card</CardTitle>
                <CardDescription>Basic card with header and content</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This is a simple card component with basic styling and structure.</p>
              </CardContent>
            </Card>

            {/* Interactive Card */}
            <Card>
              <CardHeader>
                <CardTitle>Interactive Card</CardTitle>
                <CardDescription>Card with form elements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" placeholder="Enter your name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="Enter your email" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">Cancel</Button>
                <Button>Submit</Button>
              </CardFooter>
            </Card>

            {/* Pricing Card */}
            <Card className="border-blue-200">
              <CardHeader className="bg-blue-50">
                <CardTitle className="text-blue-700">Premium Plan</CardTitle>
                <CardDescription>For professional users</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold mb-4">$29.99<span className="text-sm font-normal text-gray-500">/month</span></div>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    Unlimited access
                  </li>
                  <li className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    Premium support
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Subscribe Now</Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* Form Components Section */}
        <section className="mb-16 grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <h2 className="text-2xl font-semibold mb-6">Input Fields</h2>
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="default-input">Default Input</Label>
                <Input id="default-input" placeholder="Default input field" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="disabled-input">Disabled Input</Label>
                <Input id="disabled-input" placeholder="Disabled input field" disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="with-icon">Input with Icon</Label>
                <div className="relative">
                  <Input id="with-icon" placeholder="Search..." className="pl-10" />
                  <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-6">Selects & Switches</h2>
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="language">Select Language</Label>
                <Select>
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Select a language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="jp">Japanese</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-5 mt-8">
                <div className="flex items-center space-x-2">
                  <Switch id="notifications" />
                  <Label htmlFor="notifications">Enable notifications</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch id="marketing" defaultChecked />
                  <Label htmlFor="marketing">Subscribe to newsletter</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch id="darkmode" disabled />
                  <Label htmlFor="darkmode" className="text-gray-400">Dark mode (disabled)</Label>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Text Area Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6">Text Areas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="default-textarea">Default Textarea</Label>
              <Textarea id="default-textarea" placeholder="Type your message here..." />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="large-textarea">Larger Textarea</Label>
              <Textarea id="large-textarea" placeholder="Write a detailed description..." className="min-h-32" />
            </div>
          </div>
        </section>

        {/* Pagination Section */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-6">Pagination</h2>
          <div className="space-y-6">
            <div className="border rounded-lg p-6 bg-white">
              <h3 className="text-xl font-medium mb-4">Default Pagination</h3>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious href="#" />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#">1</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#" isActive>2</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#">3</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext href="#" />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
            
            <div className="border rounded-lg p-6 bg-white">
              <h3 className="text-xl font-medium mb-4">Extended Pagination</h3>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious href="#" />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#">1</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#">2</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#" isActive>3</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#">4</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#">5</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#">10</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext href="#" />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
} 