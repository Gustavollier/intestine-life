import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, MapPin, Star, ExternalLink, Navigation, Search, AlertCircle } from "lucide-react";

interface Clinic {
  name: string;
  address: string;
  rating: number | null;
  user_ratings_total: number;
  open_now: boolean | null;
  lat: number;
  lng: number;
  distance: number | null;
  place_id: string;
}

export default function Clinics() {
  const navigate = useNavigate();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [radius, setRadius] = useState("10000");
  const [locationDenied, setLocationDenied] = useState(false);
  const [manualLocation, setManualLocation] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const searchClinics = useCallback(async (lat: number, lng: number, r: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("search-clinics", {
        body: { lat, lng, radius: parseInt(r) },
      });
      if (fnError) throw fnError;
      setClinics(data?.clinics || []);
      if ((data?.clinics || []).length === 0) {
        setError("Nenhum consultório encontrado nessa região. Tente aumentar o raio de busca.");
      }
    } catch (e: any) {
      console.error(e);
      setError("Erro ao buscar consultórios. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationDenied(true);
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        setLocationDenied(false);
        searchClinics(latitude, longitude, radius);
      },
      () => {
        setLocationDenied(true);
        setLoading(false);
      }
    );
  }, [radius, searchClinics]);

  useEffect(() => {
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRadiusChange = (value: string) => {
    setRadius(value);
    if (coords) {
      searchClinics(coords.lat, coords.lng, value);
    }
  };

  const handleManualSearch = async () => {
    if (!manualLocation.trim()) return;
    setLoading(true);
    setError(null);
    try {
      // Use Google Geocoding via the edge function won't work, so we use a simple approach
      // We'll search with the location name directly
      const { data, error: fnError } = await supabase.functions.invoke("search-clinics", {
        body: { lat: -23.55, lng: -46.63, radius: parseInt(radius), query: `proctologista em ${manualLocation}` },
      });
      if (fnError) throw fnError;
      setClinics(data?.clinics || []);
      if ((data?.clinics || []).length === 0) {
        setError("Nenhum consultório encontrado. Tente outro endereço ou cidade.");
      }
    } catch {
      setError("Erro ao buscar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const openInMaps = (clinic: Clinic) => {
    window.open(`https://www.google.com/maps/place/?q=place_id:${clinic.place_id}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-4 sm:px-6 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="font-bold text-foreground">Consultórios de Proctologia</h1>
          <p className="text-xs text-muted-foreground">Encontre especialistas perto de você</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 sm:p-6 space-y-4">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Select value={radius} onValueChange={handleRadiusChange}>
              <SelectTrigger>
                <SelectValue placeholder="Raio de busca" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5000">5 km</SelectItem>
                <SelectItem value="10000">10 km</SelectItem>
                <SelectItem value="25000">25 km</SelectItem>
                <SelectItem value="50000">50 km</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {!locationDenied && coords && (
            <Button variant="outline" onClick={() => searchClinics(coords.lat, coords.lng, radius)} disabled={loading}>
              <Navigation className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          )}
        </div>

        {/* Location denied fallback */}
        {locationDenied && (
          <Card className="border-border">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">Localização não disponível. Digite sua cidade ou CEP:</span>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: São Paulo, SP"
                  value={manualLocation}
                  onChange={(e) => setManualLocation(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
                />
                <Button onClick={handleManualSearch} disabled={loading}>
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-border">
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Results */}
        {!loading && clinics.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{clinics.length} consultório(s) encontrado(s)</p>
            {clinics.map((clinic) => (
              <Card key={clinic.place_id} className="border-border hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-sm leading-tight">{clinic.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{clinic.address}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        {clinic.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs font-medium text-foreground">{clinic.rating}</span>
                            <span className="text-xs text-muted-foreground">({clinic.user_ratings_total})</span>
                          </div>
                        )}
                        {clinic.distance !== null && (
                          <span className="text-xs text-muted-foreground">{clinic.distance} km</span>
                        )}
                        {clinic.open_now !== null && (
                          <span className={`text-xs font-medium ${clinic.open_now ? "text-primary" : "text-destructive"}`}>
                            {clinic.open_now ? "Aberto" : "Fechado"}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => openInMaps(clinic)} className="shrink-0">
                      <ExternalLink className="w-3.5 h-3.5 mr-1" />
                      Mapa
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
