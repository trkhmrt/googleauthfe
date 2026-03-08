import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API_BASE = "https://gateway.algorycode.com/ael/authservice";
const GOOGLE_CLIENT_ID =
    "990624623867-o83douun4e0vke2nur5qteo9pr4mmlf8.apps.googleusercontent.com";

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const timer = setInterval(() => {
            if (window.google) {
                clearInterval(timer);
                initGoogleLogin();
            }
        }, 200);

        // Timeout ekle: 5 saniye içinde Google yüklenmediyse uyar
        const timeout = setTimeout(() => {
            clearInterval(timer);
            setError("Google Identity Services yüklenemedi");
        }, 5000);

        return () => {
            clearInterval(timer);
            clearTimeout(timeout);
        };
    }, []);

    const initGoogleLogin = () => {
        try {
            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleGoogleCredentials,
            });

            window.google.accounts.id.renderButton(
                document.getElementById("google-btn"),
                {
                    theme: "outline",
                    size: "large",
                    text: "signin_with",
                    locale: "tr_TR", // Türkçe dil desteği
                }
            );
        } catch (err) {
            setError("Google button initialize edilemedi");
            console.error(err);
        }
    };

    const handleGoogleCredentials = async (response) => {
        setLoading(true);
        setError(null);

        try {
            const res = await axios.post(
                `${API_BASE}/auth/google/login`,
                { idToken: response.credential },
                {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            setUser(res.data.user); // Backend'den dönen user bilgisi
            console.log("Login başarılı:", res.data);

        } catch (err) {
            console.error("Login hatası:", err);
            setError(
                err.response?.data?.message ||
                "Giriş yapılırken bir hata oluştu"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        setLoading(true);
        setError(null);

        try {
            await axios.post(
                `${API_BASE}/auth/logout`,
                {},
                { withCredentials: true }
            );

            setUser(null);

            // Google sign-out
            if (window.google) {
                window.google.accounts.id.disableAutoSelect();
            }

            console.log("Logout başarılı");

        } catch (err) {
            console.error("Logout hatası:", err);
            setError("Çıkış yapılırken bir hata oluştu");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <h1>GOOGLE AUTH LOGIN</h1>
            <p>Bu bir Google Auth projesi</p>

            {error && (
                <div style={{
                    color: 'red',
                    padding: '10px',
                    marginBottom: '10px',
                    border: '1px solid red',
                    borderRadius: '4px'
                }}>
                    ⚠️ {error}
                </div>
            )}

            {loading && <p>Yükleniyor...</p>}

            {!user ? (
                <div id="google-btn" style={{ marginBottom: 16 }} />
            ) : (
                <div style={{ marginBottom: 16 }}>
                    <h3>Hoş geldin, {user.name}!</h3>
                    <p>Email: {user.email}</p>
                    {user.picture && (
                        <img
                            src={user.picture}
                            alt="Profile"
                            style={{ borderRadius: '50%', width: 80 }}
                        />
                    )}
                </div>
            )}

            {user && (
                <button
                    onClick={handleLogout}
                    disabled={loading}
                >
                    {loading ? "Çıkış yapılıyor..." : "Logout"}
                </button>
            )}
        </>
    );
}

export default App;
