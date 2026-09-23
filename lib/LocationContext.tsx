import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

type LocationState = {
  latitude: number;
  longitude: number;
  label: string; // contoh: "Malang, Jawa Timur"
};

type LocationContextType = {
  location: LocationState | null;
  isLoading: boolean;
  permissionDenied: boolean;
  detectCurrentLocation: () => Promise<boolean>;
  setManualLocation: (loc: LocationState) => Promise<void>;
};

const LocationContext = createContext<LocationContextType | undefined>(
  undefined,
);

const STORAGE_KEY = "lastKnownLocation";

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<LocationState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const detectCurrentLocation = async (): Promise<boolean> => {
    setIsLoading(true);
    setPermissionDenied(false);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setPermissionDenied(true);
        setIsLoading(false);
        return false;
      }

      // Jika GPS lambat/gagal, pakai posisi terakhir yang diketahui.
      let position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      }).catch(() => Location.getLastKnownPositionAsync());
      if (!position) throw new Error("Posisi tidak tersedia");

      const { latitude, longitude } = position.coords;

      // Reverse geocode gagal tidak boleh membatalkan seluruh proses.
      const [place] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      }).catch(() => []);

      const city = place?.city || place?.subregion || place?.district || "";
      const region = place?.region || "";
      const label =
        [city, region].filter(Boolean).join(", ") || "Lokasi tidak diketahui";

      const newLocation: LocationState = { latitude, longitude, label };
      setLocation(newLocation);

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newLocation));
      return true;
    } catch (e) {
      console.log("Gagal mendeteksi lokasi:", e);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Dipakai saat pengguna memilih lokasi manual: hasil pencarian alamat
  // (Nominatim), atau tap salah satu "Lokasi Tersimpan".
  const setManualLocation = async (loc: LocationState) => {
    setLocation(loc);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
    } catch (e) {
      console.log("Gagal menyimpan lokasi manual:", e);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const cached = await AsyncStorage.getItem(STORAGE_KEY);
        if (cached) {
          setLocation(JSON.parse(cached));
        }
      } catch (e) {
        console.log("Gagal membaca lokasi tersimpan:", e);
      }

      await detectCurrentLocation();
    })();
  }, []);

  return (
    <LocationContext.Provider
      value={{
        location,
        isLoading,
        permissionDenied,
        detectCurrentLocation,
        setManualLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocation harus dipakai di dalam <LocationProvider>");
  }
  return context;
}
