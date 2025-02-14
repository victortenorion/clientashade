
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/ui/navigation-menu";
import { navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import { Settings } from "lucide-react";
import { Link } from "react-router-dom";

export const ServiceOrderSettingsMenu = () => {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <Link
              to="/dashboard/service-order-settings/status"
              className={navigationMenuTriggerStyle()}
            >
              Status
            </Link>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};
