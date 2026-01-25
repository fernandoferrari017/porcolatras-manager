/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from './supabaseClient';

import { 
  Trophy, Settings, LogOut, Calendar, BarChart3, Edit2, 
  FileDown, Trash2, MapPin, Plus, Key, Shield, UserPlus, 
  AlertTriangle, TrendingDown, X, CheckCircle, Star, Home, Bus, 
  ChevronRight, Search, Info, Users, Filter, ArrowUpRight, ChevronLeft,
  Award, Target, Zap, Clock, ShieldCheck, PieChart, Activity,
  Download, FilterX, HelpCircle, RefreshCw, UserCheck, AlertCircle
} from 'lucide-react';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/** 👇 AGORA SIM */
const APP_VERSION = "2026.01.21";

/**
 * ==========================================================================================
 * SISTEMA DE GESTÃO, AUDITORIA E RANKING - ASSOCIAÇÃO PORCOLATRAS
 * VERSION: 4.5.0 (INTEGRAL)
 * DEVELOPER: Gemini Thought Partner
 * CLIENT: Fernando Ferrari (fernando.ferrari@hotmail.com.br)
 * ==========================================================================================
 * * DESCRIÇÃO DE TABELAS SUPABASE NECESSÁRIAS:
 * 1. profiles (id, nome, apelido, role, email, avatar_url)
 * 2. jogos (id, data_jogo, local, tipo_local, adversario, campeonato, observacao)
 * 3. presencas (id, usuario_id, jogo_id, apelido, status, data_solicitacao)
 */

// ------------------------------------------------------------------------------------------
// CSS ANIMATIONS & GLOBAL STYLES (INJECTED)
// ------------------------------------------------------------------------------------------
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;900&display=swap');
    
    body { 
      margin: 0; 
      padding: 0; 
      font-family: 'Inter', sans-serif; 
      background-color: #f0f2f5; 
      color: #1e293b;
    }

    .animate-fade-in { animation: fadeIn 0.3s ease-in-out; }
    .animate-slide-up { animation: slideUp 0.4s ease-out; }
    
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #15803d; border-radius: 10px; }

    .card-hover { transition: all 0.2s ease; }
    .card-hover:hover { transform: translateY(-4px); box-shadow: 0 12px 20px rgba(0,0,0,0.1); }

    .glass-effect {
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.3);
    }
  `}</style>
);
export default function App() {

  useEffect(() => {
    const storedVersion = localStorage.getItem("app_version");

    if (storedVersion !== APP_VERSION) {
      localStorage.setItem("app_version", APP_VERSION);
      window.location.reload();
    }
  }, []);

  // -----------------------------------
  // ---------------------------------------------------------
  // ---------------------------------------------------------
// 1. ESTADOS DE AUTENTICAÇÃO E PERFIL
// ---------------------------------------------------------
const [user, setUser] = useState<any>(null);
const [userProfile, setUserProfile] = useState<any>(null);
const [authLoading, setAuthLoading] = useState(true);
const [actionLoading, setActionLoading] = useState(false);
const [searchUserTerm, setSearchUserTerm] = useState('');
const [showOnlyMarked, setShowOnlyMarked] = useState(false);
// ---------------------------------------------------------
// 🔹 DETECTOR DE MOBILE (PASSO 1)
// ---------------------------------------------------------
const [isMobile, setIsMobile] = useState(false);
// 🔹 CONTROLE DO MENU MOBILE
const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
useEffect(() => {
  const checkMobile = () => {
    setIsMobile(window.innerWidth <= 768);
  };

  checkMobile(); // executa ao carregar
  window.addEventListener('resize', checkMobile);

  return () => {
    window.removeEventListener('resize', checkMobile);
  };
}, []);

  // ---------------------------------------------------------
  // 2. ESTADOS DE NAVEGAÇÃO
  // ---------------------------------------------------------
  const [currentView, setCurrentView] = useState('dashboard');
  const [adminSubView, setAdminSubView] = useState('pendencias');
  const [historyFilter, setHistoryFilter] = useState('todos');
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);


  // ---------------------------------------------------------
  // 3. ESTADOS DE DADOS BRUTOS (SINCRONIZADOS COM SUPABASE)
  // ---------------------------------------------------------
  const [dbJogos, setDbJogos] = useState<any[]>([]);
  const [dbUsuarios, setDbUsuarios] = useState<any[]>([]);
  const [dbPresencas, setDbPresencas] = useState<any[]>([]);
  const [minhasMarcacoes, setMinhasMarcacoes] = useState<string[]>([]);

  // ---------------------------------------------------------
  // 4. ESTADOS DE RANKING PROCESSADO
  // ---------------------------------------------------------
  const [rankingAtual, setRankingAtual] = useState<any[]>([]);
  const [rankingCasa, setRankingCasa] = useState<any[]>([]);
  const [rankingFora, setRankingFora] = useState<any[]>([]);

  // ---------------------------------------------------------
  // 5. ESTADOS DE AUDITORIA E SELEÇÃO
  // ---------------------------------------------------------
  const [auditTarget, setAuditTarget] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // ---------------------------------------------------------
  // 6. ESTADOS DE MODAIS E FORMULÁRIOS
  // ---------------------------------------------------------
  const [modalUserVisible, setModalUserVisible] = useState(false);
  const [modalJogoVisible, setModalJogoVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  const [loginForm, setLoginForm] = useState({ identifier: '', password: '' });
  const [userForm, setUserForm] = useState({ id: '', nome: '', apelido: '', role: 'usuario', password: '', email: '' });
  const [jogoForm, setJogoForm] = useState({ data_jogo: '', local: '', tipo_local: 'Casa', adversario: '', campeonato: 'Paulista 2026' });

  // ---------------------------------------------------------
  // 7. DESIGN SYSTEM - PALETA DE CORES E COMPONENTES
  // ---------------------------------------------------------
  const theme = {
    primary: '#15803d',
    primaryDark: '#052e16',
    secondary: '#fbbf24',
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
    text: '#1e293b',
    textLight: '#64748b',
    white: '#ffffff',
    bg: '#f8fafc'
  };

  const ui = {
    card: {
      background: theme.white,
      borderRadius: '24px',
      padding: '30px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
    },
    input: {
      width: '100%',
      padding: '16px 20px',
      borderRadius: '14px',
      border: '2px solid #e2e8f0',
      fontSize: '16px',
      marginBottom: '15px',
      boxSizing: 'border-box' as 'border-box',
      outline: 'none',
      transition: 'all 0.2s ease',
      '&:focus': { borderColor: theme.primary }
    },
    button: (color: string, ghost = false) => ({
      background: ghost ? 'transparent' : color,
      color: ghost ? color : theme.white,
      padding: '16px 24px',
      borderRadius: '14px',
      border: ghost ? `2px solid ${color}` : 'none',
      fontWeight: '800',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      justifyContent: 'center',
      transition: 'all 0.2s',
      fontSize: '14px'
    }),
    badge: (bgColor: string, textColor: string) => ({
      background: bgColor,
      color: textColor,
      padding: '6px 14px',
      borderRadius: '10px',
      fontSize: '11px',
      fontWeight: '900',
      textTransform: 'uppercase' as 'uppercase',
      letterSpacing: '0.5px'
    })
  };

  // ---------------------------------------------------------
  // 8. UTILITÁRIOS E FORMATAÇÃO
  // ---------------------------------------------------------
  const formatDate = (dateString: string) => {
    if (!dateString) return "Data indefinida";
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getDayName = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase();
  };

  // ---------------------------------------------------------
  // 9. LÓGICA DE NEGÓCIO: CARREGAMENTO E PROCESSAMENTO
  // ---------------------------------------------------------
  const refreshAllData = useCallback(async (currentUserId: string) => {
    setActionLoading(true);
    try {
      // Busca paralela para máxima performance
      const [respJogos, respUsers, respPresencas] = await Promise.all([
        supabase.from('jogos').select('*').order('data_jogo', { ascending: false }),
        supabase.from('profiles').select('*').order('nome', { ascending: true }),
        supabase.from('presencas').select('*')
      ]);

      if (respJogos.error) throw respJogos.error;
      if (respUsers.error) throw respUsers.error;
      if (respPresencas.error) throw respPresencas.error;

      const jData = respJogos.data || [];
      const uData = respUsers.data || [];
      const pData = respPresencas.data || [];

      setDbJogos(jData);
      setDbUsuarios(uData);
      setDbPresencas(pData);
      setMinhasMarcacoes(pData.filter(p => p.usuario_id === currentUserId).map(p => p.jogo_id));

      // PROCESSAMENTO DE RANKING (Lógica de Negócio Central)
      const statsMap: any = {};
      
      // Inicializa todos os usuários no mapa para garantir que apareçam no ranking com 0 pontos
      uData.forEach(u => {
        statsMap[u.id] = {
          id: u.id,
          nome: u.nome,
          apelido: u.apelido,
          total: 0,
          casa: 0,
          fora: 0
        };
      });

      // Filtra apenas presenças aprovadas e computa pontos
      pData.filter(p => p.status === 'APROVADO').forEach(p => {
        const userId = p.usuario_id;
        if (statsMap[userId]) {
          statsMap[userId].total += 1;
          
          // Verifica se o jogo foi em casa ou fora para rankings específicos
          const jogoInfo = jData.find(j => j.id === p.jogo_id);
          if (jogoInfo?.tipo_local === 'Casa') statsMap[userId].casa += 1;
          if (jogoInfo?.tipo_local === 'Fora') statsMap[userId].fora += 1;
        }
      });

      // Converte mapa para array e ordena
      const finalRanking = Object.values(statsMap);
      setRankingAtual([...finalRanking].sort((a: any, b: any) => b.total - a.total));
      setRankingCasa([...finalRanking].sort((a: any, b: any) => b.casa - a.casa));
      setRankingFora([...finalRanking].sort((a: any, b: any) => b.fora - a.fora));

    } catch (error: any) {
      console.error("Erro crítico ao carregar dados:", error.message);
      alert("Erro ao sincronizar com o servidor.");
    } finally {
      setActionLoading(false);
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        setUserProfile(profile);
        if (profile) refreshAllData(session.user.id);
      }
      setAuthLoading(false);
    };
    initializeAuth();
  }, [refreshAllData]);

// 10. FUNÇÕES DE AÇÃO: LOGIN, LOGOUT, CADASTROS
  // ---------------------------------------------------------
  const handleAuthAction = async () => {
    setActionLoading(true);
    try {
      let targetEmail = loginForm.identifier?.trim();
      
      if (!targetEmail) throw new Error("Por favor, digite seu e-mail ou apelido.");

      // LOGIN HÍBRIDO: Se não contiver '@', buscamos o e-mail pelo apelido na tabela profiles
      if (!targetEmail.includes('@')) {
        const { data: p, error: pError } = await supabase
          .from('profiles')
          .select('email')
          .ilike('apelido', targetEmail)
          .maybeSingle();

        if (pError) throw new Error("Erro na busca de perfil: " + pError.message);
        
        if (!p || !p.email) {
          throw new Error("Apelido não encontrado ou sem e-mail vinculado. Tente usar o e-mail completo.");
        }
        
        targetEmail = p.email;
      }

      // Procede com o login oficial no Supabase Auth
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: loginForm.password
      });

      if (authError) {
        if (authError.message === 'Invalid login credentials') {
          throw new Error("Usuário ou senha incorretos.");
        }
        throw authError;
      }

      // Login bem-sucedido: recarrega para atualizar o estado da sessão
      window.location.reload();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    setActionLoading(true);
    try {
      await supabase.auth.signOut();
      localStorage.clear(); // Limpa dados do celular
      sessionStorage.clear();
      window.location.replace('/'); // Volta para o login limpando a tela
    } catch (error) {
      window.location.href = '/';
    }
  };

  const saveMembro = async () => {
    setActionLoading(true);
    try {
      if (editMode) {
        // --- MODO EDIÇÃO ---
        
        // 1. Atualiza os dados básicos no Profile
        const { error: profError } = await supabase.from('profiles').update({
          nome: userForm.nome,
          apelido: userForm.apelido,
          role: userForm.role
        }).eq('id', userForm.id);
        
        if (profError) throw profError;

        // 2. Troca de senha via RPC se o campo de senha foi preenchido
        if (userForm.password && userForm.password.length >= 6) {
          const { error: authError } = await supabase.rpc('admin_change_password', {
            u_id: userForm.id,
            new_password: userForm.password
          });
          if (authError) throw new Error("Perfil salvo, mas erro ao mudar senha: " + authError.message);
          alert("Perfil e Senha atualizados com sucesso!");
        } else {
          alert("Perfil atualizado com sucesso!");
        }

      } else {
        // --- MODO NOVO CADASTRO ---

        // GERAÇÃO DE E-MAIL: Se vazio, gera um automático conforme sua regra
        const autoEmail = userForm.email?.trim() || 
          `${userForm.apelido.toLowerCase().replace(/\s/g, '')}_${Math.random().toString(36).substr(2, 5)}@porcolatras.com.br`;

        // Criar conta no Auth do Supabase
        const { data: authData, error: authErr } = await supabase.auth.signUp({
          email: autoEmail,
          password: userForm.password,
          options: {
            data: {
              nome: userForm.nome,
              apelido: userForm.apelido,
              role: userForm.role
            }
          }
        });

        if (authErr) throw authErr;

        // GARANTIA DE LOGIN HÍBRIDO: Salva o e-mail na tabela profiles
        if (authData.user) {
          const { error: profErr } = await supabase.from('profiles').upsert([{
            id: authData.user.id,
            nome: userForm.nome,
            apelido: userForm.apelido,
            role: userForm.role,
            email: autoEmail 
          }]);
          
          if (profErr) throw profErr;
        }
        
        alert(`Sucesso!\nApelido: ${userForm.apelido}\nE-mail gerado: ${autoEmail}`);
      }

      // Limpa o formulário e fecha o modal
      setModalUserVisible(false);
      setUserForm({ id: '', nome: '', apelido: '', role: 'membro', email: '', password: '' });
      await refreshAllData(user.id);
      
    } catch (e: any) {
      alert("Erro na operação: " + e.message);
    } finally {
      setActionLoading(false);
    }
  };
  // ---------------------------------------------------------
  // 11. FUNÇÕES DE AUDITORIA E PONTUAÇÃO
  // ---------------------------------------------------------
  const openAuditView = async (targetUser: any) => {
    setAuditTarget(targetUser);
    setCurrentView('auditoria');
  
    const { data: presencas, error } = await supabase
      .from('presencas')
      .select('*')
      .eq('usuario_id', targetUser.id)
      .order('id', { ascending: false });
  
    if (error) {
      console.error(error);
      return;
    }
  
    const jogosIds = presencas.map(p => p.jogo_id);
  
    const { data: jogos } = await supabase
      .from('jogos')
      .select('*')
      .in('id', jogosIds);
  
    const historicoCompleto = presencas.map(p => ({
      ...p,
      jogos: jogos?.find(j => j.id === p.jogo_id)
    }));
  
    setAuditLogs(historicoCompleto);
  };
  
  // ---------------------------------------------------------
  // 12. COMPONENTES DE INTERFACE (PARTES DA TELA)
  // ---------------------------------------------------------
  
  // RENDER: TELA DE LOGIN
if (!user && !authLoading) return (
  <div
    style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: theme.primaryDark,
      padding: '20px',
      position: 'relative'
    }}
  >
    <GlobalStyles />
    {/* CONTEÚDO ORIGINAL DA TELA DE LOGIN CONTINUA ABAIXO */}

      <div className="animate-slide-up" style={{ ...ui.card, width: '100%', maxWidth: '420px', padding: '50px 40px', textAlign: 'center' }}>
        <div style={{ marginBottom: '30px' }}>
          <div style={{ width: '90px', height: '90px', background: '#f0fdf4', borderRadius: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Trophy size={48} color={theme.primary} />
          </div>
          <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '900', color: theme.primary, letterSpacing: '-1px' }}>PORCOLATRAS</h1>
          <p style={{ color: theme.textLight, fontWeight: '600', marginTop: '5px' }}>Gestão de Ranking 2026</p>
        </div>

        <div style={{ textAlign: 'left' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: theme.textLight, marginBottom: '8px', textTransform: 'uppercase' }}>Seu Apelido</label>
          <input 
            style={ui.input} 
            placeholder="Ex: ferrari" 
            value={loginForm.identifier}
            onChange={e => setLoginForm({...loginForm, identifier: e.target.value})}
          />
          
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: theme.textLight, marginBottom: '8px', textTransform: 'uppercase', marginTop: '10px' }}>Senha de Acesso</label>
          <input 
            type="password" 
            style={ui.input} 
            placeholder="••••••••" 
            value={loginForm.password}
            onChange={e => setLoginForm({...loginForm, password: e.target.value})}
            onKeyDown={e => e.key === 'Enter' && handleAuthAction()}
          />

          <button 
            disabled={actionLoading}
            onClick={handleAuthAction}
            style={{ ...ui.button(theme.primary), width: '100%', marginTop: '20px', fontSize: '16px' }}
          >
            {actionLoading ? <RefreshCw className="animate-spin" /> : 'ENTRAR NO SISTEMA'}
          </button>
        </div>
        
        <p style={{ marginTop: '30px', fontSize: '13px', color: theme.textLight, fontWeight: '500' }}>
          Esqueceu sua senha? Contate o administrador.
        </p>
      </div>
    </div>
  );

  // RENDER: SISTEMA PRINCIPAL
  return (
    <div style={{ background: theme.bg, minHeight: '100vh' }}>
      <GlobalStyles />
      
      {/* NAVBAR SUPERIOR */}<header
  className="glass-effect"
  style={{
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    borderBottom: '1px solid #e2e8f0',
    padding: '0 20px'
  }}
>
  <div
    style={{
      maxWidth: '1100px',
      margin: '0 auto',
      height: '80px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}
  >
    <div
      style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
      onClick={() => setCurrentView('dashboard')}
    >
      <div style={{ background: theme.primary, padding: '8px', borderRadius: '12px' }}>
        <Star size={24} color={theme.white} fill={theme.white} />
      </div>
      <span
        style={{
          fontWeight: '900',
          fontSize: '22px',
          color: theme.primaryDark,
          letterSpacing: '-0.5px'
        }}
      >
        PORCOLATRAS
      </span>
    </div>

    <div
      style={{
        display: 'flex',
        gap: '8px',
        background: '#f1f5f9',
        padding: '6px',
        borderRadius: '16px'
      }}
    >
      <button
        onClick={() => setCurrentView('dashboard')}
        style={{
          border: 'none',
          padding: '10px 18px',
          borderRadius: '12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: '700',
          fontSize: '14px',
          transition: '0.2s',
          background: currentView === 'dashboard' ? theme.white : 'transparent',
          color: currentView === 'dashboard' ? theme.primary : theme.textLight,
          boxShadow: currentView === 'dashboard' ? '0 4px 6px rgba(0,0,0,0.05)' : 'none'
        }}
      >
        <BarChart3 size={18} /> Ranking
      </button>

      <button
        onClick={() => setCurrentView('jogos')}
        style={{
          border: 'none',
          padding: '10px 18px',
          borderRadius: '12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: '700',
          fontSize: '14px',
          transition: '0.2s',
          background: currentView === 'jogos' ? theme.white : 'transparent',
          color: currentView === 'jogos' ? theme.primary : theme.textLight,
          boxShadow: currentView === 'jogos' ? '0 4px 6px rgba(0,0,0,0.05)' : 'none'
        }}
      >
        <Calendar size={18} /> Jogos
      </button>

      {userProfile?.role === 'admin' && (
        <>
          <button
            onClick={() => setCurrentView('admin')}
            style={{
              border: 'none',
              padding: '10px 18px',
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '700',
              fontSize: '14px',
              transition: '0.2s',
              background: currentView === 'admin' ? theme.white : 'transparent',
              color: currentView === 'admin' ? theme.primary : theme.textLight,
              boxShadow: currentView === 'admin' ? '0 4px 6px rgba(0,0,0,0.05)' : 'none'
            }}
          >
            <Settings size={18} /> Painel ADM
          </button>

          {/* 🔹 NOVA ABA – PRESENÇA POR USUÁRIO */}
          <button
            onClick={() => setCurrentView('presenca-admin')}
            style={{
              border: 'none',
              padding: '10px 18px',
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '700',
              fontSize: '14px',
              transition: '0.2s',
              background: currentView === 'presenca-admin' ? theme.white : 'transparent',
              color: currentView === 'presenca-admin' ? theme.primary : theme.textLight,
              boxShadow:
                currentView === 'presenca-admin'
                  ? '0 4px 6px rgba(0,0,0,0.05)'
                  : 'none'
            }}
          >
            👥 Presença por Usuário
          </button>
        </>
      )}

      <button
        onClick={handleLogout}
        style={{
          border: 'none',
          background: 'transparent',
          padding: '10px',
          color: theme.danger,
          cursor: 'pointer'
        }}
      >
        <LogOut size={20} />
      </button>
    </div>
  </div>
</header>

<main
  style={{
    maxWidth: isMobile ? '1100px' : '1400px',
    margin: '40px auto',
    padding: '0 20px'
  }}
>


{/* VIEW: DASHBOARD (RANKING DINÂMICO) */}
{currentView === 'dashboard' && (
  <div className="animate-fade-in">

    <div
      style={{
        width: '100%',
        maxWidth: isMobile ? '100%' : '1400px',
        margin: '0 auto'
      }}
    >
      {/* CABEÇALHO */}
      <div
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'flex-end',
          marginBottom: '30px',
          gap: '15px'
        }}
      >
        <div>
          <h2 style={{ fontSize: '38px', fontWeight: '900', margin: 0 }}>
            Classificação Geral
          </h2>

          <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
            <div style={ui.badge('#dcfce7', theme.primary)}>Temporada 2026</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: theme.textLight }}>
              <Users size={16} /> {dbUsuarios.length} Membros ativos
            </div>
          </div>
        </div>

        <button
  onClick={async () => {
 // 🔥 FORÇA SINCRONIZAÇÃO NO MOBILE
 await refreshAllData(user.id);
    // =====================================================
    // BUSCAR DADOS ATUALIZADOS (FONTE DA VERDADE)
    // =====================================================
    const [{ data: jogos }, { data: usuarios }, { data: presencasAtualizadas }] =
      await Promise.all([
        supabase.from('jogos').select('*'),
        supabase.from('profiles').select('*'),
        supabase.from('presencas').select('*').eq('status', 'APROVADO')
      ]);

    if (!jogos || !usuarios || !presencasAtualizadas) {
      alert('Erro ao gerar relatório atualizado');
      return;
    }
    const statsMap: any = {};

    usuarios.forEach(u => {
      statsMap[u.id] = {
        id: u.id,
        nome: u.nome,
        apelido: u.apelido,
        casa: 0,
        fora: 0,
        total: 0
      };
    });
    
    presencasAtualizadas.forEach(p => {
      const jogo = jogos.find(j => j.id === p.jogo_id);
      if (!jogo || !statsMap[p.usuario_id]) return;
    
      statsMap[p.usuario_id].total += 1;
      if (jogo.tipo_local === 'Casa') statsMap[p.usuario_id].casa += 1;
      if (jogo.tipo_local === 'Fora') statsMap[p.usuario_id].fora += 1;
    });
    
    const rankingAtual = Object.values(statsMap).sort(
      (a: any, b: any) => b.total - a.total
    );
    
    const doc = new jsPDF();

    // =====================================================
    // CABEÇALHO
    // =====================================================
    doc.setFontSize(22);
    doc.setTextColor(21, 128, 61);
    doc.text("RANKING OFICIAL PORCOLATRAS 2026", 14, 18);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(
      "Relatório oficial de desempenho dos membros",
      14,
      25
    );

    // =====================================================
    // TOP 3 - LÍDERES
    // =====================================================
    doc.setFontSize(15);
    doc.setTextColor(0);
    doc.text("TOP 3 - LÍDERES DA TEMPORADA", 14, 36);

    autoTable(doc, {
      startY: 42,
      head: [["POSIÇÃO", "APELIDO", "NOME", "CASA", "FORA", "TOTAL"]],
      body: rankingAtual.slice(0, 3).map((r: any, i: number) => [
        i === 0 ? "LÍDER" : i === 1 ? "VICE-LÍDER" : "3º COLOCADO",
        r.apelido,
        r.nome,
        r.casa,
        r.fora,
        r.total
      ]),
      headStyles: { fillColor: [21, 128, 61] },
      styles: { fontStyle: "bold" }
    });

    // =====================================================
    // RANKING COMPLETO
    // =====================================================
    const rankingStartY = doc.lastAutoTable.finalY + 10;

    doc.setFontSize(15);
    doc.text("RANKING GERAL COMPLETO", 14, rankingStartY);

    autoTable(doc, {
      startY: rankingStartY + 5,
      head: [["POS", "APELIDO", "NOME", "CASA", "FORA", "TOTAL"]],
      body: rankingAtual.map((r: any, i: number) => [
        i + 1,
        r.apelido,
        r.nome,
        r.casa,
        r.fora,
        r.total
      ]),
      didParseCell(data) {
        if (data.row.section === 'body') {
          const jogador = rankingAtual[data.row.index] as any;
          if (jogador && jogador.total < 5) {
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
      headStyles: { fillColor: [30, 41, 59] }
    });

    // =====================================================
    // AVISO ZONA DA DEGOLA
    // =====================================================
    const avisoY = doc.lastAutoTable.finalY + 10;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(220, 38, 38);

    doc.text(
      "ATENÇÃO: OS INTEGRANTES QUE NÃO COMPLETAREM 5 JOGOS AO FINAL DA TEMPORADA, SERÃO EXCLUÍDOS DO GRUPO.",
      14,
      avisoY,
      { maxWidth: 180 }
    );

    doc.setFont("helvetica", "normal");

    // =====================================================
    // DETALHAMENTO DOS JOGOS (100% ATUALIZADO)
    // =====================================================
    let y = avisoY + 14;

    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text("DETALHAMENTO DOS JOGOS (CASA / FORA)", 14, y);

    y += 10;

    jogos.forEach(jogo => {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }

      const presentesArray = presencasAtualizadas
        .filter(p => p.jogo_id === jogo.id)
        .map(p => {
          const usuario = usuarios.find(u => u.id === p.usuario_id);
          return usuario ? usuario.apelido : "Usuário removido";
        });

      const presentes =
        presentesArray.length > 0
          ? presentesArray.join(", ")
          : "Nenhum participante";

      doc.setFontSize(12);
      doc.setTextColor(21, 128, 61);
      doc.text(
        `PALMEIRAS x ${jogo.adversario} (${jogo.tipo_local})`,
        14,
        y
      );

      y += 6;

      doc.setFontSize(10);
      doc.setTextColor(80);
      doc.text(
        `${jogo.local} | ${formatDate(jogo.data_jogo)}`,
        14,
        y
      );

      y += 6;

      doc.setFontSize(10);
      doc.setTextColor(60);

      const textoPresentes = `Presentes: ${presentes}`;
      const linhas = doc.splitTextToSize(textoPresentes, 180);

      doc.text(linhas, 14, y);
      y += linhas.length * 5 + 8;
    });

    doc.save("ranking_porcolatras_2026_completo.pdf");
  }}
  style={{ ...ui.button(theme.primary), width: isMobile ? '100%' : 'auto' }}
>
  Exportar
</button>



      </div>

      {/* PODIUM TOP 3 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '35px'
        }}
      >
        {[1, 0, 2].map(pos => {
          const item = rankingAtual[pos];
          if (!item) return null;
          const isFirst = pos === 0;

          return (
            <div
              key={item.id}
              onClick={() => openAuditView(item)}
              style={{
                flex: 1,
                maxWidth: isMobile ? '100px' : '180px',
                background: isFirst ? '#fefce8' : '#f8fafc',
                border: isFirst ? '2px solid #facc15' : '1px solid #e5e7eb',
                borderRadius: '14px',
                padding: '10px',
                textAlign: 'center',
                cursor: 'pointer'
              }}
            >
              <div style={{ fontWeight: '900', fontSize: isFirst ? '20px' : '16px' }}>
                {pos === 0 ? '🏆 1º' : pos === 1 ? '2º' : '3º'}
              </div>
              <div style={{ fontWeight: '800', marginTop: '4px' }}>
                {item.apelido}
              </div>
              <div style={{ fontSize: '12px', color: theme.textLight }}>
                {item.total} jogos
              </div>
              <div style={{ fontSize: '10px', marginTop: '6px', color: theme.primary }}>
                👆 detalhes
              </div>
            </div>
          );
        })}
      </div>

      {/* BUSCA */}
      <div style={ui.card}>
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <Search size={20} style={{ position: 'absolute', left: '15px', top: '14px', color: theme.textLight }} />
          <input
            placeholder="Buscar membro pelo apelido ou nome..."
            style={{ ...ui.input, paddingLeft: '45px' }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* LISTA RANKING */}
        {rankingAtual
          .filter(r =>
            r.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.apelido.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map((item, index) => {
            const isDegola = item.total < 5;


            return (
              <div
  key={item.id}
  onClick={() => openAuditView(item)}
  style={{
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    padding: '18px',
    borderBottom: '1px solid #f1f5f9',
    gap: '10px',
    cursor: 'pointer',
    background: item.id === user.id ? '#f0fdf4' : 'transparent'
  }}
>

                <div style={{ fontWeight: '900', width: '40px' }}>
                  {index + 1}º
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: '800' }}>{item.nome}</span>
                    <span style={ui.badge('#f1f5f9', '#64748b')}>@{item.apelido}</span>
                    {isDegola && (
                      <span style={ui.badge('#fee2e2', theme.danger)}>
                        Zona de Degola
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '12px', color: theme.textLight, marginTop: '4px', display: 'flex', gap: '12px' }}>
                    <span><Home size={12}/> {item.casa} Casa</span>
                    <span><Bus size={12}/> {item.fora} Fora</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '22px', fontWeight: '900' }}>
                    {item.total}
                  </div>
                  <div style={{ fontSize: '10px', color: theme.textLight }}>
                    Jogos
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  </div>
)}

        {/* VIEW: AUDITORIA (HISTÓRICO INDIVIDUAL) */}
        {currentView === 'auditoria' && (
          <div className="animate-fade-in">
            <button 
              onClick={() => setCurrentView('dashboard')}
              style={{ background: 'none', border: 'none', color: theme.primary, fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '25px' }}
            >
              <ChevronLeft size={20} /> VOLTAR AO RANKING GERAL
            </button>

            <div style={{ ...ui.card, background: theme.primaryDark, color: theme.white, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '32px', fontWeight: '900' }}>{auditTarget?.nome}</h2>
                <div style={{ display: 'flex', gap: '20px', marginTop: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}><Home size={18} /> {auditTarget?.casa} em Casa</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}><Bus size={18} /> {auditTarget?.fora} Fora</div>
                </div>
              </div>
              <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '24px', minWidth: '120px' }}>
                <div style={{ fontSize: '48px', fontWeight: '900', lineHeight: 1 }}>{auditTarget?.total}</div>
                <div style={{ fontSize: '11px', fontWeight: '800', marginTop: '5px', opacity: 0.8 }}>TOTAL DE JOGOS</div>
              </div>
            </div>

            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '900', fontSize: '22px', marginBottom: '20px' }}>
              <Clock size={24} color={theme.primary} /> Histórico de Presenças
            </h3>

            {auditLogs.length === 0 ? (
              <div style={{ ...ui.card, textAlign: 'center', color: theme.textLight }}>Nenhum jogo registrado para este membro.</div>
            ) : (
              auditLogs.map((log: any) => (
                <div key={log.id} style={{ ...ui.card, marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                      <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '14px', border: '1px solid #e2e8f0', textAlign: 'center', minWidth: '60px' }}>
                        <div style={{ fontSize: '10px', fontWeight: '900', color: theme.primary }}>{getDayName(log.jogos?.data_jogo)}</div>
                        <div style={{ fontSize: '20px', fontWeight: '900' }}>{log.jogos?.data_jogo.split('-')[2]}</div>
                      </div>
                      <div>
                        <div style={{ fontWeight: '900', fontSize: '18px' }}>PALMEIRAS x {log.jogos?.adversario}</div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '4px', fontSize: '13px', color: theme.textLight, fontWeight: '700' }}>
                          <span>{formatDate(log.jogos?.data_jogo)}</span>
                          <span>•</span>
                          <span>{log.jogos?.local}</span>
                          <span>•</span>
                          <span style={{ color: log.jogos?.tipo_local === 'Casa' ? theme.primary : theme.warning }}>{log.jogos?.tipo_local}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      {log.status === 'APROVADO' ? (
                        <div style={{ ...ui.badge('#dcfce7', theme.primary), display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CheckCircle size={14} /> Presença Confirmada
                        </div>
                      ) : (
                        <div style={{ ...ui.badge('#fef3c7', theme.warning), display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={14} /> Aguardando Validação
                        </div>
                      )}

                      {userProfile.role === 'admin' && (
                        <button 
                          onClick={async () => {
                            if (window.confirm("Deseja realmente remover esta pontuação?")) {
                              await supabase.from('presencas').delete().eq('id', log.id);
                              openAuditView(auditTarget);
                              refreshAllData(user.id);
                            }
                          }}
                          style={{ background: '#fee2e2', border: 'none', padding: '10px', borderRadius: '10px', cursor: 'pointer' }}
                        >
                          <Trash2 size={18} color={theme.danger} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

{/* VIEW: JOGOS (RESPONSIVO MOBILE + DESKTOP, SEM ALTERAR FUNCIONALIDADE) */}
{currentView === 'jogos' && (
  <div className="animate-fade-in">

    {/* TOPO: TÍTULO + BOTÃO */}
    <div
      style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        marginBottom: '30px',
        gap: isMobile ? '15px' : '0'
      }}
    >
      <h2 style={{ fontSize: '32px', fontWeight: '900', margin: 0 }}>
        Próximos Jogos
      </h2>

      {userProfile?.role === 'admin' && (
        <button
          onClick={() => {
            setEditMode(false);
            setJogoForm({
              data_jogo: '',
              local: '',
              tipo_local: 'Casa',
              adversario: '',
              campeonato: 'Paulista 2026'
            });
            setModalJogoVisible(true);
          }}
          style={{ ...ui.button(theme.primary), width: isMobile ? '100%' : 'auto' }}
        >
          <Plus size={20} /> NOVO JOGO
        </button>
      )}
    </div>

    {/* LISTA DE JOGOS */}
    {dbJogos.map(jogo => {
      const jaConfirmado = minhasMarcacoes.includes(jogo.id);

      return (
        <div
          key={jogo.id}
          style={{
            ...ui.card,
            marginBottom: '20px',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '20px' : '0',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'stretch' : 'center'
          }}
        >

          {/* ESQUERDA: DATA + INFO */}
          <div
            style={{
              display: 'flex',
              gap: '20px',
              alignItems: 'center'
            }}
          >
            {/* DATA */}
            <div
              style={{
                background: '#f8fafc',
                padding: '14px',
                borderRadius: '18px',
                border: '1px solid #e2e8f0',
                textAlign: 'center',
                minWidth: '80px'
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: '900', color: theme.primary }}>
                {getDayName(jogo.data_jogo)}
              </div>
              <div style={{ fontSize: '28px', fontWeight: '900', color: theme.primaryDark }}>
                {jogo.data_jogo.split('-')[2]}
              </div>
              <div style={{ fontSize: '12px', fontWeight: '800', color: theme.textLight }}>
                {jogo.data_jogo.split('-')[1] === '01' ? 'JAN' : '2026'}
              </div>
            </div>

            {/* INFO */}
            <div>
              <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '900', color: theme.primaryDark }}>
                PALMEIRAS x {jogo.adversario}
              </h3>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '15px',
                  marginTop: '6px',
                  color: theme.textLight,
                  fontWeight: '700',
                  fontSize: '14px'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={16} /> {formatDate(jogo.data_jogo)}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={16} /> {jogo.local}
                </span>
              </div>
            </div>
          </div>

          {/* DIREITA: AÇÕES */}
          <div style={{ minWidth: isMobile ? '100%' : '220px' }}>
            <button
              disabled={actionLoading}
              onClick={async () => {
                setActionLoading(true);
                try {
                  if (jaConfirmado) {
                    const { error } = await supabase
                      .from('presencas')
                      .delete()
                      .eq('usuario_id', user.id)
                      .eq('jogo_id', jogo.id);
                    if (error) throw error;
                  } else {
                    const { error } = await supabase
                      .from('presencas')
                      .insert([{
                        usuario_id: user.id,
                        jogo_id: jogo.id,
                        apelido: userProfile?.apelido || 'Membro',
                        status: userProfile?.role === 'admin' ? 'APROVADO' : 'PENDENTE'
                      }]);
                    if (error) throw error;
                  }
                  await refreshAllData(user.id);
                } catch (e: any) {
                  alert('Erro ao atualizar: ' + e.message);
                } finally {
                  setActionLoading(false);
                }
              }}
              style={{
                ...ui.button(jaConfirmado ? '#cbd5e1' : theme.primary),
                width: '100%',
                color: jaConfirmado ? '#475569' : '#fff'
              }}
            >
              {jaConfirmado ? (
                <><CheckCircle size={20} /> PRESENÇA CONFIRMADA</>
              ) : (
                <><Target size={20} /> EU VOU PRO JOGO</>
              )}
            </button>

            <p
              style={{
                textAlign: 'center',
                fontSize: '12px',
                marginTop: '8px',
                fontWeight: '700',
                color: theme.textLight
              }}
            >
              {jaConfirmado ? 'Ponto será validado pelo ADM' : 'Clique para confirmar'}
            </p>

            {/* EXCLUIR (ADMIN) */}
            {userProfile?.role === 'admin' && (
  <button
    disabled={actionLoading}
    title="Excluir jogo"
    onClick={async () => {
      const confirmar = window.confirm(
        'Deseja excluir este jogo? Todas as presenças serão apagadas.'
      );
      if (!confirmar) return;

      setActionLoading(true);
      try {
        await supabase.from('presencas').delete().eq('jogo_id', jogo.id);
        const { error } = await supabase.from('jogos').delete().eq('id', jogo.id);
        if (error) throw error;
        await refreshAllData(user.id);
        alert('Jogo excluído com sucesso!');
      } catch (e: any) {
        alert('Erro ao excluir jogo: ' + e.message);
      } finally {
        setActionLoading(false);
      }
    }}
    style={{
      marginTop: '10px',
      width: '100%',
      background: 'transparent',
      color: '#ef4444',
      padding: '8px',
      borderRadius: '10px',
      border: '1px solid #fee2e2',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}
  >
    <Trash2 size={18} />
  </button>
)}

          </div>
        </div>
      );
    })}
  </div>
)}

        {/* VIEW: ADMINISTRAÇÃO (PAINEL DE CONTROLE) */}
{currentView === 'admin' && (
  <div className="animate-fade-in">

    {/* TÍTULO */}
    <h2
      style={{
        fontSize: '32px',
        fontWeight: '900',
        color: theme.primaryDark,
        marginBottom: '20px'
      }}
    >
      Painel de Controle
    </h2>

    {/* BOTÃO SAIR (FLOAT) */}
    <button
      onClick={handleLogout}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 5000,
        ...ui.button(theme.danger)
      }}
    >
      🚪 Sair
    </button>

    {/* SWITCH DE SUBVIEWS */}
    <div
      style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: '10px',
        marginBottom: '30px',
        background: '#e2e8f0',
        padding: '6px',
        borderRadius: '18px',
        width: isMobile ? '100%' : 'fit-content'
      }}
    >
      <button
        onClick={() => setAdminSubView('pendencias')}
        style={{
          border: 'none',
          padding: '12px 25px',
          borderRadius: '14px',
          cursor: 'pointer',
          fontWeight: '800',
          transition: '0.2s',
          background: adminSubView === 'pendencias' ? theme.primary : 'transparent',
          color: adminSubView === 'pendencias' ? theme.white : theme.textLight,
          width: isMobile ? '100%' : 'auto'
        }}
      >
        Aprovações ({dbPresencas.filter(p => p.status === 'PENDENTE').length})
      </button>

      <button
        onClick={() => setAdminSubView('membros')}
        style={{
          border: 'none',
          padding: '12px 25px',
          borderRadius: '14px',
          cursor: 'pointer',
          fontWeight: '800',
          transition: '0.2s',
          background: adminSubView === 'membros' ? theme.primary : 'transparent',
          color: adminSubView === 'membros' ? theme.white : theme.textLight,
          width: isMobile ? '100%' : 'auto'
        }}
      >
        Gestão de Membros
      </button>
    </div>

    {/* ================= PENDÊNCIAS ================= */}
    {adminSubView === 'pendencias' && (
      <div className="animate-fade-in">

        {dbPresencas.filter(p => p.status === 'PENDENTE').length === 0 ? (
          <div style={{ ...ui.card, textAlign: 'center', padding: '50px' }}>
            <CheckCircle size={48} color={theme.primary} style={{ marginBottom: '15px', opacity: 0.3 }} />
            <p style={{ fontWeight: '700', color: theme.textLight }}>
              Tudo em dia! Nenhuma pendência de aprovação.
            </p>
          </div>
        ) : (
          dbPresencas
            .filter(p => p.status === 'PENDENTE')
            .map(p => (
              <div key={p.id} style={{ ...ui.card, marginBottom: '15px' }}>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    justifyContent: 'space-between',
                    alignItems: isMobile ? 'flex-start' : 'center',
                    gap: '15px'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '900', fontSize: '18px' }}>
                      {p.apelido}
                    </div>
                    <div
                      style={{
                        color: theme.textLight,
                        fontWeight: '700',
                        fontSize: '14px',
                        marginTop: '4px'
                      }}
                    >
                      Solicitou presença no jogo{' '}
                      <b style={{ color: theme.primaryDark }}>
                        ID #{p.jogo_id.slice(0, 5)}
                      </b>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: '10px',
                      width: isMobile ? '100%' : 'auto'
                    }}
                  >
                    <button
                      onClick={async () => {
                        await supabase.from('presencas').delete().eq('id', p.id);
                        refreshAllData(user.id);
                      }}
                      style={{
                        ...ui.button(theme.danger, true),
                        flex: 1
                      }}
                    >
                      <X size={18} />
                    </button>

                    <button
                      onClick={async () => {
                        await supabase
                          .from('presencas')
                          .update({ status: 'APROVADO' })
                          .eq('id', p.id);
                        refreshAllData(user.id);
                      }}
                      style={{
                        ...ui.button(theme.primary),
                        flex: 2
                      }}
                    >
                      <CheckCircle size={18} /> Aprovar
                    </button>
                  </div>
                </div>
              </div>
            ))
        )}
      </div>
    )}

    {/* ================= MEMBROS ================= */}
    {adminSubView === 'membros' && (
      <div className="animate-fade-in">

        <button
          onClick={() => {
            setEditMode(false);
            setUserForm({
              id: '',
              nome: '',
              apelido: '',
              role: 'usuario',
              password: '',
              email: ''
            });
            setModalUserVisible(true);
          }}
          style={{
            ...ui.button(theme.primary),
            width: '100%',
            marginBottom: '25px'
          }}
        >
          <UserPlus size={20} /> Cadastrar novo integrante
        </button>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px'
          }}
        >
          {dbUsuarios.map(u => (
            <div key={u.id} style={ui.card}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start'
                }}
              >
                <div>
                  <div style={{ fontWeight: '900', fontSize: '18px' }}>
                    {u.nome}
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: '800',
                      color: theme.primary,
                      marginTop: '2px'
                    }}
                  >
                    @{u.apelido.toUpperCase()}
                  </div>

                  <div style={{ marginTop: '10px' }}>
                    <span
                      style={ui.badge(
                        u.role === 'admin' ? '#052e16' : '#f1f5f9',
                        u.role === 'admin' ? 'white' : '#64748b'
                      )}
                    >
                      {u.role === 'admin' ? 'Administrador' : 'Membro'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      setEditMode(true);
                      setUserForm({ ...u, password: '' });
                      setModalUserVisible(true);
                    }}
                    style={{
                      background: '#f1f5f9',
                      border: 'none',
                      padding: '10px',
                      borderRadius: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    <Edit2 size={16} />
                  </button>

                  <button
                    onClick={async () => {
                      if (window.confirm(`Excluir permanentemente o membro ${u.apelido}?`)) {
                        await supabase.from('profiles').delete().eq('id', u.id);
                        refreshAllData(user.id);
                      }
                    }}
                    style={{
                      background: '#fee2e2',
                      border: 'none',
                      padding: '10px',
                      borderRadius: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={16} color={theme.danger} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

  </div>
)}

 {/* VIEW: PRESENÇA POR USUÁRIO (UX FINAL MOBILE + DESKTOP) */}
{currentView === 'presenca-admin' && (
  <div className="animate-fade-in">

    <h2 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '25px' }}>
      Presença por Usuário
    </h2>

    {/* ================= LISTA DE USUÁRIOS ================= */}
    {!usuarioSelecionado && (
      <>
        {/* BUSCA */}
        <input
          placeholder="Buscar usuário pelo nome ou apelido..."
          value={searchUserTerm}
          onChange={e => setSearchUserTerm(e.target.value)}
          style={{
            ...ui.input,
            marginBottom: '20px'
          }}
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile
              ? '1fr'
              : 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '15px'
          }}
        >
          {dbUsuarios
            .filter(
              u =>
                u.nome.toLowerCase().includes(searchUserTerm.toLowerCase()) ||
                u.apelido.toLowerCase().includes(searchUserTerm.toLowerCase())
            )
            .map(u => (
              <div
                key={u.id}
                onClick={() => setUsuarioSelecionado(u)}
                style={{
                  ...ui.card,
                  cursor: 'pointer',
                  transition: '0.2s'
                }}
              >
                <div style={{ fontWeight: '800', fontSize: '16px' }}>
                  {u.nome}
                </div>
                <div style={{ fontSize: '12px', color: theme.textLight }}>
                  @{u.apelido}
                </div>
              </div>
            ))}
        </div>
      </>
    )}

    {/* ================= DETALHES DO USUÁRIO ================= */}
    {usuarioSelecionado && (
      <>
        {/* HEADER */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            marginBottom: '25px'
          }}
        >
          {/* BOTÃO VOLTAR (VERDE E BRANCO) */}
          <button
            onClick={() => setUsuarioSelecionado(null)}
            style={{
              background: theme.primary,
              color: '#ffffff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '900',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 8px 18px rgba(21,128,61,0.25)'
            }}
          >
            ← Voltar
          </button>

          <div>
            <div style={{ fontWeight: '900', fontSize: '20px' }}>
              {usuarioSelecionado.nome}
            </div>
            <div style={{ fontSize: '12px', color: theme.textLight }}>
              @{usuarioSelecionado.apelido}
            </div>
          </div>
        </div>

        {/* CONTADOR */}
        <div
          style={{
            ...ui.card,
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <strong>Total de Presenças</strong>
          <span style={{ fontWeight: '900', fontSize: '18px' }}>
            {
              dbPresencas.filter(
                p =>
                  p.usuario_id === usuarioSelecionado.id &&
                  p.status === 'APROVADO'
              ).length
            }
          </span>
        </div>

        {/* FILTRO */}
        <label style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
          <input
            type="checkbox"
            checked={showOnlyMarked}
            onChange={e => setShowOnlyMarked(e.target.checked)}
          />
          Mostrar apenas jogos com presença
        </label>

        {/* JOGOS */}
        {dbJogos
          .filter(jogo => {
            if (!showOnlyMarked) return true;
            return dbPresencas.some(
              p =>
                p.usuario_id === usuarioSelecionado.id &&
                p.jogo_id === jogo.id
            );
          })
          .map(jogo => {
            const presenca = dbPresencas.find(
              p =>
                p.usuario_id === usuarioSelecionado.id &&
                p.jogo_id === jogo.id
            );

            return (
              <div key={jogo.id} style={{ ...ui.card, marginBottom: '15px' }}>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    justifyContent: 'space-between',
                    alignItems: isMobile ? 'flex-start' : 'center',
                    gap: '12px'
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '16px' }}>
                      {jogo.adversario}
                    </strong>
                    <div style={{ fontSize: '12px', color: theme.textLight }}>
                      {jogo.data_jogo}
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      if (presenca) {
                        await supabase
                          .from('presencas')
                          .delete()
                          .eq('id', presenca.id);
                      } else {
                        await supabase.from('presencas').insert({
                          usuario_id: usuarioSelecionado.id,
                          jogo_id: jogo.id,
                          status: 'APROVADO',
                          apelido: usuarioSelecionado.apelido
                        });
                      }
                      refreshAllData(user.id);
                    }}
                    style={{
                      ...ui.button(
                        presenca ? '#cbd5e1' : theme.primary
                      ),
                      width: isMobile ? '100%' : '220px'
                    }}
                  >
                    {presenca ? 'Remover Presença' : 'Marcar Presença'}
                  </button>
                </div>
              </div>
            );
          })}
      </>
    )}
  </div>
)}

      </main>

{/* MODAL: USUÁRIO (CREATE/EDIT) */}
{modalUserVisible && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(5, 46, 22, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}>
          <div className="animate-slide-up" style={{ ...ui.card, width: '100%', maxWidth: '480px' }}>
            <h3 style={{ fontWeight: '900', fontSize: '24px', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <UserPlus color={theme.primary} /> {editMode ? 'Editar Usuário' : 'Novo Usuário'}
            </h3>
            
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: theme.textLight, marginBottom: '6px', textTransform: 'uppercase' }}>Nome Completo</label>
            <input style={ui.input} value={userForm.nome} onChange={e => setUserForm({ ...userForm, nome: e.target.value })} placeholder="Nome do integrante" />
            
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: theme.textLight, marginBottom: '6px', textTransform: 'uppercase' }}>Apelido</label>
            <input style={ui.input} value={userForm.apelido} onChange={e => setUserForm({ ...userForm, apelido: e.target.value })} placeholder="Como aparece no ranking" />

            <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: theme.textLight, marginBottom: '6px', textTransform: 'uppercase' }}>E-mail (Login)</label>
            <input 
              style={ui.input} 
              value={userForm.email} 
              disabled={editMode} 
              onChange={e => setUserForm({ ...userForm, email: e.target.value })} 
              placeholder="Deixe vazio para gerar um automático"
            />

            <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: theme.textLight, marginBottom: '6px', textTransform: 'uppercase' }}>
              {editMode ? 'Alterar Senha (deixe vazio para manter)' : 'Senha de Acesso'}
            </label>
            <input 
              type="password" 
              style={ui.input} 
              placeholder={editMode ? "Nova senha" : "Mínimo 6 caracteres"}
              value={userForm.password || ''}
              onChange={e => setUserForm({ ...userForm, password: e.target.value })} 
            />
            
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: theme.textLight, marginBottom: '6px', textTransform: 'uppercase' }}>Nível de Acesso</label>
            <select style={ui.input} value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })}>
              <option value="membro">Membro</option>
              <option value="admin">Administrador</option>
            </select>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button onClick={() => {
                setModalUserVisible(false);
                setUserForm({ id: '', nome: '', apelido: '', role: 'membro', email: '', password: '' });
              }} style={{ ...ui.button('#f1f5f9', true), flex: 1, color: theme.text }}>FECHAR</button>
              
              <button 
                disabled={actionLoading}
                onClick={async () => {
                  if (!editMode && (!userForm.nome || !userForm.password)) {
                    alert("Nome e Senha são obrigatórios para novos usuários!");
                    return;
                  }

                  setActionLoading(true);
                  try {
                    if (editMode) {
                      // 1. ATUALIZA DADOS NO PROFILE
                      const { error: profError } = await supabase.from('profiles').update({ 
                        nome: userForm.nome, 
                        apelido: userForm.apelido, 
                        role: userForm.role 
                      }).eq('id', userForm.id);
                      
                      if (profError) throw profError;
                      
                      // 2. ATUALIZA SENHA SE TIVER SIDO DIGITADA
                      if (userForm.password && userForm.password.length >= 6) {
                        const { error: authError } = await supabase.rpc('admin_change_password', {
                          u_id: userForm.id,
                          new_password: userForm.password
                        });
                        if (authError) throw authError;
                        alert("Perfil e Senha alterados com sucesso!");
                      } else {
                        alert("Perfil atualizado com sucesso!");
                      }
                    } else {
                      // LÓGICA PARA NOVO USUÁRIO + EMAIL ALEATÓRIO
                      const baseEmail = userForm.apelido.toLowerCase().replace(/\s+/g, '');
const finalEmail = userForm.email?.trim() 
  || `${baseEmail}@porcolatras.com.br`;

const { data, error: signUpError } = await supabase.auth.signUp({
  email: finalEmail,
  password: userForm.password,
  options: { 
    data: { 
      nome: userForm.nome, 
      apelido: userForm.apelido, 
      role: userForm.role 
    } 
  }
});

if (signUpError) throw signUpError;

// GARANTE profile imediato
if (data?.user?.id) {
  await supabase.from('profiles').insert([{
    id: data.user.id,
    nome: userForm.nome,
    apelido: userForm.apelido,
    role: userForm.role
  }]);
}
                      alert(`Usuário criado!\nEmail: ${finalEmail}\nSenha: ${userForm.password}`);
                    }

                    setModalUserVisible(false);
                    setUserForm({ id: '', nome: '', apelido: '', role: 'membro', email: '', password: '' });
                    await refreshAllData(user.id);
                  } catch (e: any) {
                    alert("Erro na operação: " + e.message);
                  } finally {
                    setActionLoading(false);
                  }
                }} 
                style={{ ...ui.button(theme.primary), flex: 2 }}
              >
                {actionLoading ? 'PROCESSANDO...' : (editMode ? 'SALVAR ALTERAÇÕES' : 'CRIAR USUÁRIO')}
              </button>
            </div>
          </div>
        </div>
      )}
{/* MODAL: JOGO (CREATE) - LAYOUT ORIGINAL CORRIGIDO */}
{modalJogoVisible && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(5, 46, 22, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}>
          <div className="animate-slide-up" style={{ ...ui.card, width: '100%', maxWidth: '480px' }}>
            <h3 style={{ fontWeight: '900', fontSize: '24px', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Calendar color={theme.primary} /> Agendar Partida
            </h3>
            
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: theme.textLight, marginBottom: '6px', textTransform: 'uppercase' }}>Data do Jogo</label>
            <input type="date" value={jogoForm.data_jogo} style={ui.input} onChange={e => setJogoForm({ ...jogoForm, data_jogo: e.target.value })} />
            
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: theme.textLight, marginBottom: '6px', textTransform: 'uppercase' }}>Adversário</label>
            <input style={ui.input} value={jogoForm.adversario} placeholder="Ex: Adversário" onChange={e => setJogoForm({ ...jogoForm, adversario: e.target.value })} />
            
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: theme.textLight, marginBottom: '6px', textTransform: 'uppercase' }}>Estádio / Local</label>
            <input style={ui.input} value={jogoForm.local} placeholder="Ex: Allianz Parque" onChange={e => setJogoForm({ ...jogoForm, local: e.target.value })} />
            
            <div style={{ display: 'flex', gap: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: theme.textLight, marginBottom: '6px', textTransform: 'uppercase' }}>Tipo</label>
                <select style={ui.input} value={jogoForm.tipo_local} onChange={e => setJogoForm({ ...jogoForm, tipo_local: e.target.value })}>
                  <option value="Casa">Casa</option>
                  <option value="Fora">Fora</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: theme.textLight, marginBottom: '6px', textTransform: 'uppercase' }}>Campeonato</label>
                <input style={ui.input} value={jogoForm.campeonato} placeholder="Ex: Paulista 2026" onChange={e => setJogoForm({ ...jogoForm, campeonato: e.target.value })} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button onClick={() => setModalJogoVisible(false)} style={{ ...ui.button('#f1f5f9', true), flex: 1, color: theme.text }}>FECHAR</button>
              <button 
                disabled={actionLoading}
                onClick={async () => {
                  if (!jogoForm.data_jogo || !jogoForm.adversario) {
                    alert("Atenção: Data e Adversário são obrigatórios!");
                    return;
                  }

                  setActionLoading(true);
                  try {
                    // REMOVEMOS o campo 'campeonato' para o banco aceitar o cadastro
                    // já que o erro indica que essa coluna não existe ou está errada lá.
                    const { error } = await supabase.from('jogos').insert([{
                      data_jogo: jogoForm.data_jogo,
                      adversario: jogoForm.adversario,
                      local: jogoForm.local || 'A definir',
                      tipo_local: jogoForm.tipo_local || 'Casa',
                      // A coluna 'campeonato' foi retirada daqui para parar o erro
                    }]);

                    if (error) throw error;

                    // Sucesso: Limpa e fecha
                    setModalJogoVisible(false);
                    setJogoForm({ data_jogo: '', local: '', tipo_local: 'Casa', adversario: '', campeonato: 'Paulista 2026' });
                    
                    const currentId = user?.id || '';
                    await refreshAllData(currentId);
                    
                    alert("Jogo cadastrado com sucesso (sem o campo campeonato)!");

                  } catch (err: any) {
                    alert("Erro persistente: " + err.message);
                  } finally {
                    setActionLoading(false);
                  }
                }} 
                style={{ ...ui.button(theme.primary), flex: 2 }}
              >
                {actionLoading ? 'CADASTRANDO...' : 'CADASTRAR JOGO'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* BARRA DE CARREGAMENTO GLOBAL */}
      {actionLoading && (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', background: theme.primaryDark, color: 'white', padding: '12px 24px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', zIndex: 3000 }}>
          <RefreshCw size={20} className="animate-spin" />
          <span style={{ fontWeight: '700', fontSize: '14px' }}>Sincronizando dados...</span>
        </div>
      )}
    </div>
  );
}