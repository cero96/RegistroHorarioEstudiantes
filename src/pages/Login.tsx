import React, { useState } from "react";
import {
  IonPage,
  IonContent,
  IonButton,
  IonText,
  IonSpinner,
  IonIcon,
  useIonRouter,
} from "@ionic/react";
import { logInOutline, personOutline, lockClosedOutline } from "ionicons/icons";
import "./Home.css";
import { Capacitor } from "@capacitor/core";
import { CapacitorHttp } from "@capacitor/core";

type Persona = {
  record: string;
  id: string;
  lastnames: string;
  names: string;
  mail: string;
  phone: string;
  user: string;
};

const API_WEB = "/ika/examen.php";
const API_NATIVE = "https://puce.estudioika.com/api/examen.php";

const Login: React.FC = () => {
  const router = useIonRouter();
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isNative = Capacitor.isNativePlatform?.();

  const handleLogin = async () => {
    setError(null);
    if (!usuario.trim() || !password.trim()) {
      setError("Ingresa usuario y contraseña.");
      return;
    }

    setCargando(true);
    try {
      let arr: Persona[] = [];

      if (isNative) {
        const res = await CapacitorHttp.get({
          url: API_NATIVE,
          headers: {},
          params: { user: usuario, pass: password },
        });
        arr = Array.isArray(res.data) ? res.data : [];
      } else {
        const resp = await fetch(
          `${API_WEB}?user=${encodeURIComponent(usuario)}&pass=${encodeURIComponent(password)}`
        );
        if (!resp.ok) throw new Error("No se pudo conectar al servidor");
        arr = await resp.json();
      }

      let match: Persona | undefined = arr[0];

      if (!match) {
        if (isNative) {
          const listRes = await CapacitorHttp.get({
            url: API_NATIVE,
            headers: {},
          });
          const listado: Persona[] = Array.isArray(listRes.data) ? listRes.data : [];
          match = listado.find(
            (p) =>
              (p.user || "").trim().toLowerCase() === usuario.trim().toLowerCase() &&
              p.id === password.trim()
          );
        } else {
          const listResp = await fetch(API_WEB);
          if (!listResp.ok) throw new Error("No se pudo conectar al servidor");
          const listado: Persona[] = await listResp.json();
          match = listado.find(
            (p) =>
              (p.user || "").trim().toLowerCase() === usuario.trim().toLowerCase() &&
              p.id === password.trim()
          );
        }
      }

      if (!match) {
        setError("Usuario o contraseña incorrectos.");
        return;
      }

      localStorage.setItem(
        "usuarioActual",
        JSON.stringify({
          record: match.record,
          id: match.id,
          user: match.user,
          names: match.names,
          lastnames: match.lastnames,
          mail: match.mail,
        })
      );

      router.push("/ControlAsistencias", "forward", "replace");
    } catch (_e) {
      setError("Error de conexión. Intenta nuevamente.");
    } finally {
      setCargando(false);
    }
  };

  const handleEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="loginPage__container">
          <div className="loginPage__card">
            <h1 className="loginPage__title">Registro Asistencia Estudiantil</h1>
            <p className="loginPage__subtitle">
              Ingresa con tu <strong>Usuario institucional</strong>
            </p>

            <div className="loginPage__field">
              <IonIcon icon={personOutline} className="loginPage__icon" />
              <input
                className="loginPage__input"
                type="text"
                placeholder="Usuario"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                onKeyDown={handleEnter}
                disabled={cargando}
              />
            </div>

            <div className="loginPage__field">
              <IonIcon icon={lockClosedOutline} className="loginPage__icon" />
              <input
                className="loginPage__input"
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleEnter}
                disabled={cargando}
              />
            </div>

            {error && (
              <div className="loginPage__error">
                <IonText color="danger">{error}</IonText>
              </div>
            )}

            <IonButton
              expand="block"
              className="loginPage__button"
              onClick={handleLogin}
              disabled={cargando}
            >
              {cargando ? (
                <IonSpinner name="crescent" />
              ) : (
                <>
                  <IonIcon icon={logInOutline} slot="start" />
                  Iniciar Sesión
                </>
              )}
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;
