import { Plus } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NavLink } from "react-router-dom";

export default function Assets() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">App Banners</h1>
          <p className="text-muted-foreground">Manage banner content and media assets</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <NavLink to="/assets/hero-banner" className="flex-1 hover:opacity-80 transition-opacity">
            <CardTitle className="text-xl hover:text-accent transition-colors">Hero Banner</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Main banner content displayed prominently in the app
            </p>
          </NavLink>
          <Button
            size="sm"
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
            asChild
          >
            <NavLink to="/assets/hero-banner">
              <Plus className="h-4 w-4 mr-2" />
              Add Banner
            </NavLink>
          </Button>
        </CardHeader>
      </Card>
    </div>
  );
}
