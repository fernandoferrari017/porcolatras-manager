import streamlit as st
import pandas as pd
import sqlite3
import plotly.express as px
from datetime import date

# --- CONFIGURAÇÃO DA PÁGINA ---
st.set_page_config(page_title="Porcolatras Campinas", layout="wide", page_icon="🐷")

# --- BANCO DE DADOS ---
def init_db():
    conn = sqlite3.connect('porcolatras.db')
    c = conn.cursor()
    # Tabela de Membros
    c.execute('''CREATE TABLE IF NOT EXISTS membros (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nome TEXT UNIQUE)''')
    # Tabela de Jogos
    c.execute('''CREATE TABLE IF NOT EXISTS jogos (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    data DATE,
                    adversario TEXT,
                    tipo TEXT)''') # Tipo: Casa ou Fora
    # Tabela de Presença
    c.execute('''CREATE TABLE IF NOT EXISTS presenca (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    jogo_id INTEGER,
                    membro_id INTEGER,
                    UNIQUE(jogo_id, membro_id))''')
    conn.commit()
    conn.close()

def run_query(query, params=(), fetch=False):
    conn = sqlite3.connect('porcolatras.db')
    c = conn.cursor()
    try:
        c.execute(query, params)
        if fetch:
            data = c.fetchall()
            conn.close()
            return data
        conn.commit()
        conn.close()
        return True
    except sqlite3.IntegrityError:
        conn.close()
        return False

# Inicializar DB
init_db()

# --- INTERFACE ---
st.title("🐷 Porcolatras Campinas - Controle de Jogos")

# Menu Lateral
menu = st.sidebar.selectbox("Menu", ["Dashboard", "Gerenciar Jogos", "Gerenciar Membros", "Realizar Chamada", "Relatórios"])

# --- 1. DASHBOARD ---
if menu == "Dashboard":
    st.header("Estatísticas da Torcida")
    
    # Carregar dados
    conn = sqlite3.connect('porcolatras.db')
    df_presenca = pd.read_sql_query("""
        SELECT m.nome, j.tipo, j.adversario, j.data
        FROM presenca p
        JOIN membros m ON p.membro_id = m.id
        JOIN jogos j ON p.jogo_id = j.id
    """, conn)
    conn.close()

    if not df_presenca.empty:
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("Comparecimento: Casa vs Fora")
            fig_tipo = px.pie(df_presenca, names='tipo', title='Distribuição de Presença', hole=0.4, color_discrete_sequence=['#006437', '#FFFFFF'])
            st.plotly_chart(fig_tipo, use_container_width=True)

        with col2:
            st.subheader("Top 10 Membros Mais Assíduos")
            top_membros = df_presenca['nome'].value_counts().head(10).reset_index()
            top_membros.columns = ['Nome', 'Jogos']
            fig_bar = px.bar(top_membros, x='Jogos', y='Nome', orientation='h', title='Ranking de Presença', color_discrete_sequence=['#006437'])
            st.plotly_chart(fig_bar, use_container_width=True)
            
        st.metric("Total de Presenças Registradas no Ano", len(df_presenca))
    else:
        st.info("Nenhum dado registrado ainda para gerar gráficos.")

# --- 2. GERENCIAR JOGOS ---
elif menu == "Gerenciar Jogos":
    st.header("Cadastro de Jogos")
    
    # Formulário
    col1, col2, col3 = st.columns(3)
    with col1:
        data_jogo = st.date_input("Data do Jogo", date.today())
    with col2:
        adversario = st.text_input("Adversário")
    with col3:
        tipo = st.selectbox("Mando de Campo", ["Casa", "Fora"])
        
    if st.button("Cadastrar Jogo"):
        if adversario:
            run_query("INSERT INTO jogos (data, adversario, tipo) VALUES (?, ?, ?)", (data_jogo, adversario, tipo))
            st.success(f"Jogo contra {adversario} cadastrado!")
        else:
            st.error("Digite o nome do adversário.")

    st.divider()
    st.subheader("Jogos Cadastrados (Excluir/Editar)")
    jogos = run_query("SELECT id, data, adversario, tipo FROM jogos ORDER BY data DESC", fetch=True)
    
    if jogos:
        df_jogos = pd.DataFrame(jogos, columns=['ID', 'Data', 'Adversário', 'Local'])
        st.dataframe(df_jogos, hide_index=True)
        
        jogo_excluir = st.selectbox("Selecione um jogo para excluir", options=jogos, format_func=lambda x: f"{x[1]} - {x[2]} ({x[3]})")
        if st.button("Excluir Jogo Selecionado"):
            run_query("DELETE FROM jogos WHERE id = ?", (jogo_excluir[0],))
            run_query("DELETE FROM presenca WHERE jogo_id = ?", (jogo_excluir[0],)) # Remove presenças daquele jogo
            st.warning("Jogo removido.")
            st.rerun()

# --- 3. GERENCIAR MEMBROS ---
elif menu == "Gerenciar Membros":
    st.header("Cadastro de Integrantes")
    novo_membro = st.text_input("Nome do Integrante")
    
    if st.button("Adicionar Membro"):
        if novo_membro:
            res = run_query("INSERT INTO membros (nome) VALUES (?)", (novo_membro,))
            if res:
                st.success(f"{novo_membro} adicionado com sucesso!")
            else:
                st.error("Membro já existe.")
    
    st.divider()
    st.subheader("Lista de Membros")
    membros = run_query("SELECT id, nome FROM membros ORDER BY nome", fetch=True)
    if membros:
        df_membros = pd.DataFrame(membros, columns=['ID', 'Nome'])
        st.dataframe(df_membros, hide_index=True)
        
        # Opção de Excluir
        membro_excluir = st.selectbox("Excluir Membro", options=membros, format_func=lambda x: x[1])
        if st.button("Excluir Membro"):
            run_query("DELETE FROM membros WHERE id = ?", (membro_excluir[0],))
            run_query("DELETE FROM presenca WHERE membro_id = ?", (membro_excluir[0],))
            st.rerun()

# --- 4. REALIZAR CHAMADA ---
elif menu == "Realizar Chamada":
    st.header("Lista de Presença")
    
    jogos = run_query("SELECT id, data, adversario, tipo FROM jogos ORDER BY data DESC", fetch=True)
    membros = run_query("SELECT id, nome FROM membros ORDER BY nome", fetch=True)
    
    if not jogos:
        st.warning("Cadastre jogos primeiro.")
    elif not membros:
        st.warning("Cadastre membros primeiro.")
    else:
        # Selecionar Jogo
        jogo_sel = st.selectbox("Selecione o Jogo", options=jogos, format_func=lambda x: f"{x[1]} - {x[2]} ({x[3]})")
        
        st.write("### Selecione os presentes:")
        
        # Buscar quem já estava presente
        presencas_atuais = run_query("SELECT membro_id FROM presenca WHERE jogo_id = ?", (jogo_sel[0],), fetch=True)
        ids_presentes = [p[0] for p in presencas_atuais]
        
        with st.form("chamada_form"):
            selected_members = []
            # Criar colunas para ficar visualmente melhor
            cols = st.columns(3)
            for idx, membro in enumerate(membros):
                # Verifica se já estava marcado
                is_checked = membro[0] in ids_presentes
                with cols[idx % 3]:
                    if st.checkbox(membro[1], value=is_checked, key=membro[0]):
                        selected_members.append(membro[0])
            
            submitted = st.form_submit_button("Salvar Chamada")
            
            if submitted:
                # Limpa presenças anteriores desse jogo para reescrever (evita duplicidade e trata desmarcação)
                run_query("DELETE FROM presenca WHERE jogo_id = ?", (jogo_sel[0],))
                
                count = 0
                for mem_id in selected_members:
                    run_query("INSERT INTO presenca (jogo_id, membro_id) VALUES (?, ?)", (jogo_sel[0], mem_id))
                    count += 1
                st.success(f"Chamada atualizada! {count} presentes confirmados.")

# --- 5. RELATÓRIOS ---
elif menu == "Relatórios":
    st.header("Relatório Geral")
    
    conn = sqlite3.connect('porcolatras.db')
    query = """
        SELECT m.nome as 'Nome', j.data as 'Data', j.adversario as 'Adversário', j.tipo as 'Mando'
        FROM presenca p
        JOIN membros m ON p.membro_id = m.id
        JOIN jogos j ON p.jogo_id = j.id
        ORDER BY j.data DESC, m.nome ASC
    """
    df = pd.read_sql_query(query, conn)
    conn.close()
    
    st.dataframe(df, use_container_width=True)
    
    st.download_button(
        label="📥 Baixar Relatório (Excel/CSV)",
        data=df.to_csv(index=False).encode('utf-8'),
        file_name='relatorio_porcolatras.csv',
        mime='text/csv',
    )