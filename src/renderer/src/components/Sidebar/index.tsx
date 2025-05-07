export const Sidebar: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <div className="sidebar">
      {children}
    </div>
  )
}