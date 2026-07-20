import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../services/authApi";
import { useAuth } from "../context/useAuth";
import { useTranslation } from "react-i18next";
import styles from "./Auth.module.css";

export default function Register() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token } = await register(email, password);
      authLogin(token);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h1 className={styles.title}>{t("auth.registerTitle")}</h1>
        <input
          className={styles.input}
          type="email"
          placeholder={t("auth.email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className={styles.input}
          type="password"
          placeholder={t("auth.password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className={styles.error}>{error}</p>}
        <button type="submit" className={styles.button} disabled={loading}>
          {loading ? t("auth.creatingAccount") : t("auth.registerButton")}
        </button>
      </form>
    </div>
  );
}
