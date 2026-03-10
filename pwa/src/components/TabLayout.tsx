import { Outlet } from 'react-router-dom'
import { useAppColorScheme } from '../hooks/use-app-color-scheme'
import { getColors } from '../lib/theme'

export default function TabLayout() {
  const scheme = useAppColorScheme()
  const colors = getColors(scheme)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: colors.background }}>
      <div className='page-scroll'>
        <Outlet />
      </div>
      <TabBar colors={colors} />
    </div>
  )
}

import { FolderOpen, Home, Search, Settings } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { AppColors } from '../lib/theme'

const TABS = [
  { path: '/home', label: 'Home', Icon: Home },
  { path: '/search', label: 'Search', Icon: Search },
  { path: '/collections', label: 'Collections', Icon: FolderOpen },
  { path: '/settings', label: 'Settings', Icon: Settings },
]

function TabBar({ colors }: { colors: AppColors }) {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav
      style={{
        display: 'flex',
        borderTop: `1px solid ${colors.tabBarBorder}`,
        background: colors.tabBar,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        flexShrink: 0,
      }}>
      {TABS.map(({ path, label, Icon }) => {
        const active = location.pathname === path
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              paddingTop: 10,
              paddingBottom: 10,
              color: active ? colors.tabBarActive : colors.tabBarInactive,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              transition: 'color 0.15s',
              WebkitTapHighlightColor: 'transparent',
            }}>
            <Icon size={22} />
            <span style={{ fontSize: 10, fontWeight: active ? 600 : 400 }}>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
