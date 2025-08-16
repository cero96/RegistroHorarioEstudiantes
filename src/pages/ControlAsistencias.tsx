import React, { useEffect, useMemo, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonButtons,
  IonIcon,
  IonPopover,
  IonList,
  IonItemDivider,
  useIonRouter,
  IonText,
  IonModal,
} from "@ionic/react";
import {
  personCircleOutline,
  chevronDownOutline,
  logOutOutline,
  refreshOutline,
} from "ionicons/icons";
import { Capacitor, CapacitorHttp } from "@capacitor/core";
import "./ControlAsistencias.css";

// ====== Tipos ======
type Usuario = {
  record: string;
  id: string;
  user: string;
  names: string;
  lastnames: string;
  mail: string;
};

type Marcacion = {
  usuario: string;
  dia: string;
  fecha: string;
  horaRegistro: string;
  horaEntrada: string;
  novedad: string;
  isAtraso: boolean;
};

// ====== Config API ======
const isNative = Capacitor.isNativePlatform?.();
const API_URL = isNative
  ? "https://puce.estudioika.com/api/examen.php"
  : "/ika/examen.php";

const DIAS_ES = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];

function two(n: number) { return n.toString().padStart(2,"0"); }
function fmtFecha(d: Date) { return `${d.getFullYear()}-${two(d.getMonth()+1)}-${two(d.getDate())}`; }
function fmtHora(d: Date) { return `${two(d.getHours())}:${two(d.getMinutes())}:${two(d.getSeconds())}`; }
function normHora(h?: string) {
  if (!h) return "";
  const m = h.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);
  if (!m) return h;
  return `${two(+m[1])}:${two(+m[2])}:${two(m[3] ? +m[3] : 0)}`;
}
function horaEntradaSegunDia(d: Date) { return d.getDay() === 6 ? "08:00:00" : "17:00:00"; }

const ControlAsistencias: React.FC = () => {
  const [ahora, setAhora] = useState(new Date());
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [reto, setReto] = useState<number[]>([]);
  const [valores, setValores] = useState<Record<number,string>>({});
  const [marcaciones, setMarcaciones] = useState<Marcacion[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string|null>(null);

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [popoverEvent, setPopoverEvent] = useState<MouseEvent|undefined>();
  const [modalOpen, setModalOpen] = useState(false);

  const router = useIonRouter();

  // ====== hooks ======
  useEffect(() => {
    const t = setInterval(() => setAhora(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem("usuarioActual");
    if (raw) setUsuario(JSON.parse(raw));
  }, []);

  const nombreCompleto = useMemo(() => usuario ? `${usuario.lastnames} ${usuario.names}`.toUpperCase() : "", [usuario]);
  const nombreCorto = useMemo(() => {
    if (!usuario) return "";
    const [ape] = usuario.lastnames.split(" ");
    const [nom] = usuario.names.split(" ");
    return `${nom} ${ape}`;
  }, [usuario]);

  // ====== Reto cédula ======
  const generarReto = () => {
    if (!usuario?.id) return;
    const len = usuario.id.length;
    let a = Math.floor(Math.random()*len)+1;
    let b = Math.floor(Math.random()*len)+1;
    while (b===a) b = Math.floor(Math.random()*len)+1;
    setReto([a,b].sort((x,y)=>x-y));
    setValores({});
  };
  useEffect(() => { generarReto(); }, [usuario]);

  const validarReto = () => reto.every(pos => (valores[pos] ?? "") === usuario?.id.charAt(pos-1));

  // ====== Cargar registros ======
  const cargar = async () => {
    if (!usuario?.record) return;
    setCargando(true); setError(null);
    try {
      let data: any;
      if (isNative) {
        const res = await CapacitorHttp.get({url: API_URL, params:{record:usuario.record}});
        data = res.data;
      } else {
        const res = await fetch(`${API_URL}?record=${usuario.record}`);
        data = await res.json();
      }
      const arr: any[] = Array.isArray(data)?data:(data.data ?? []);
      setMarcaciones(arr.map(it=>{
        const fecha = it.fecha ?? it.date ?? "";
        const d = fecha? new Date(`${fecha}T00:00:00`):null;
        const nov = it.novedad ?? it.estado ?? "";
        const isLate = /atraso/i.test(nov);
        return {
          usuario: nombreCompleto,
          dia: d? DIAS_ES[d.getDay()] : "",
          fecha,
          horaRegistro: normHora(it.hora_registro ?? it.time ?? ""),
          horaEntrada: normHora(it.hora_entrada ?? horaEntradaSegunDia(d??new Date())),
          novedad: nov || (isLate? "Atraso":"A tiempo"),
          isAtraso: isLate,
        };
      }));
    } catch (e:any) {
      setError(e.message ?? "Error cargando registros");
    } finally { setCargando(false); }
  };
  useEffect(()=>{ if(usuario?.record) cargar(); },[usuario?.record]);

  // ====== Registrar ======
  const registrar = async () => {
    if (!validarReto()) { alert("Los dígitos no coinciden con la cédula"); return; }
    try {
      if (isNative) {
        await CapacitorHttp.post({url:API_URL, headers:{"Content-Type":"application/json"}, data:{record_user:+usuario!.record, join_user:usuario!.user}});
      } else {
        await fetch(API_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({record_user:+usuario!.record,join_user:usuario!.user})});
      }
      await cargar(); generarReto(); setModalOpen(false);
    } catch { alert("Error registrando asistencia"); }
  };

  // ====== Logout ======
  const logout = () => {
    localStorage.clear();
    if (router?.push) router.push("/login","root","replace");
    else window.location.assign("/login");
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Dashboard Asistencias</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={(e)=>{setPopoverEvent(e.nativeEvent);setPopoverOpen(true);}}>
              <IonIcon icon={personCircleOutline}/>
              <IonText style={{marginLeft:6}}>{nombreCorto}</IonText>
              <IonIcon icon={chevronDownOutline}/>
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonPopover isOpen={popoverOpen} onDidDismiss={()=>setPopoverOpen(false)} event={popoverEvent}>
        <IonList>
          <IonItem>
            <IonIcon icon={personCircleOutline} slot="start"/>
            <IonLabel>{usuario?.mail}</IonLabel>
          </IonItem>
          <IonItemDivider/>
          <IonItem button onClick={logout}>
            <IonIcon icon={logOutOutline} slot="start"/>
            <IonLabel>Cerrar sesión</IonLabel>
          </IonItem>
        </IonList>
      </IonPopover>

      <IonContent className="asist__content">
        <IonGrid fixed>
          <IonRow>
            <IonCol size="12" sizeMd="4">
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>Bienvenido</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <div className="asist__user">{nombreCompleto}</div>
                  <div className="asist__clock">
                    {DIAS_ES[ahora.getDay()]}, {fmtFecha(ahora)} {fmtHora(ahora)}
                  </div>
                  <IonButton expand="block" className="btn-morado" onClick={()=>setModalOpen(true)}>Ingresar Cédula</IonButton>
                </IonCardContent>
              </IonCard>
            </IonCol>

            <IonCol size="12" sizeMd="8">
              <IonCard>
                <IonCardHeader>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <strong>Historial</strong>
                    <IonButton size="small" fill="clear" onClick={cargar}>
                      <IonIcon icon={refreshOutline} slot="start"/>Actualizar
                    </IonButton>
                  </div>
                </IonCardHeader>
                <IonCardContent>
                  {error && <div className="tabla__error">{error}</div>}
                  <table className="tabla__registros">
                    <thead>
                      <tr>
                        <th>Día</th><th>Fecha</th><th>Registro</th><th>Entrada</th><th>Novedad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {marcaciones.map((m,i)=>(
                        <tr key={i} className={m.isAtraso?"estado-late":"estado-ok"}>
                          <td>{m.dia}</td><td>{m.fecha}</td>
                          <td>{m.horaRegistro}</td><td>{m.horaEntrada}</td>
                          <td>{m.novedad}</td>
                        </tr>
                      ))}
                      {cargando && <tr><td colSpan={5}>Cargando...</td></tr>}
                      {!cargando && marcaciones.length===0 && <tr><td colSpan={5}>Sin registros</td></tr>}
                    </tbody>
                  </table>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* Modal Cédula */}
        <IonModal isOpen={modalOpen} className="modal__cedula">
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Ingrese los dígitos de su cédula</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="cedula__reto">
                {reto.map(pos=>(
                  <div key={pos} className="cedula__retoBox">
                    <small>{pos}</small>
                    <IonInput
                      type="number"
                      maxlength={1}
                      value={valores[pos] ?? ""}
                      className="cedula__input"
                      onIonInput={e=>setValores(v=>({...v,[pos]:(e.detail.value??"").replace(/\D/g,"")}))}
                    />
                  </div>
                ))}
              </div>
              <IonButton expand="block" className="btn-morado" onClick={registrar}>Registrar</IonButton>
              <IonButton expand="block" fill="outline" color="medium" onClick={()=>setModalOpen(false)}>Cancelar</IonButton>
            </IonCardContent>
          </IonCard>
        </IonModal>

      </IonContent>
    </IonPage>
  );
};

export default ControlAsistencias;
