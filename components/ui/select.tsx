import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface SelectProps extends Omit<React.HTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  options: { value: string; label: string }[];
  selectedValue?: string;
  enableSearch?: boolean;
  onChange?: (value: string) => void;
}

const Select = React.forwardRef<HTMLInputElement, SelectProps>(
  ({ label, options = [], className, selectedValue = "", enableSearch = false, onChange, ...props }, ref) => {
    if (!Array.isArray(options)) {
      console.error("Invalid options prop. Must be an array.");
      return null;
    }

    const [displayValue, setDisplayValue] = React.useState(
      selectedValue || options[0]?.label || ""
    );
    const [searchTerm, setSearchTerm] = React.useState("");
    const [filteredOptions, setFilteredOptions] = React.useState(options);
    const [menuOpen, setMenuOpen] = React.useState(false);
    const searchInputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
      setFilteredOptions(
        options.filter((option) =>
          option.label.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }, [searchTerm, options]);

    const handleSelect = (value: string, label: string) => {
      setDisplayValue(label);
      setSearchTerm("");
      setMenuOpen(false);
      if (onChange) {
        onChange(value);
      }
    };

    return (
      <div className={cn("relative", className)}>
        {label && (
          <Label htmlFor={props.id || "select"} className="sr-only">
            {label}
          </Label>
        )}
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Input
              id={props.id || "select"}
              className="w-full rounded-md border border-gray-300 bg-transparent px-2.5 py-1.5 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              value={displayValue}
              readOnly
              {...props}
              ref={ref}
              onClick={() => setMenuOpen(true)}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-full"
            ref={(node) => {
              if (enableSearch && node && searchInputRef.current) {
                searchInputRef.current.focus();
              }
            }}
          >
            {enableSearch && (
              <div className="p-2">
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:border-gray-300 focus:outline-none focus:ring-0 active:border-gray-300"
                  ref={searchInputRef}
                />
              </div>
            )}
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => handleSelect(option.value, option.label)}
                  className={cn(
                    "cursor-pointer px-3 py-2 text-sm rounded-md",
                    displayValue === option.label ? "bg-gray-100" : "hover:bg-gray-100 cursor-pointer"
                  )}
                >
                  {option.label}
                </DropdownMenuItem>
              ))
            ) : (
              <div className="p-2 text-sm text-muted-foreground">No options found</div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }
);

Select.displayName = "Select";

export { Select };
