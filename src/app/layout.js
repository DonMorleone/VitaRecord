export const metadata = {
  title: 'VitaRecord — Gestão Inteligente de Saúde',
  description: 'Organize seus exames, receitas e vacinas com IA',
}
export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, padding: 0, background: '#07090f' }}>{children}</body>
    </html>
  )
}
