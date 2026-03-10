import { Ionicons } from '@expo/vector-icons'
import React, { useRef, useState } from 'react'
import { Dimensions, Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native'
import { useAppColorScheme } from '../hooks/use-app-color-scheme'
import { getColors, radius, spacing, typography } from '../lib/theme'

export interface MenuAction {
  label: string
  icon: string
  onPress: () => void
  destructive?: boolean
}

interface Props {
  actions: MenuAction[]
  iconSize?: number
  iconColor?: string
}

export default function ContextMenu({ actions, iconSize = 18, iconColor }: Props) {
  const scheme = useAppColorScheme()
  const colors = getColors(scheme)
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState({ top: 0, right: 0 })
  const triggerRef = useRef<React.ElementRef<typeof TouchableOpacity>>(null)

  const open = () => {
    triggerRef.current?.measure((_fx: number, _fy: number, width: number, height: number, px: number, py: number) => {
      const screenWidth = Dimensions.get('window').width
      setPos({ top: py + height + 6, right: screenWidth - px - width })
      setVisible(true)
    })
  }

  return (
    <>
      <TouchableOpacity ref={triggerRef} onPress={open} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name='ellipsis-horizontal' size={iconSize} color={iconColor ?? colors.textTertiary} />
      </TouchableOpacity>

      <Modal transparent visible={visible} animationType='fade' onRequestClose={() => setVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setVisible(false)}>
          <View style={StyleSheet.absoluteFill}>
            {/* Inner touchable prevents taps on the menu from closing it */}
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.menu,
                  {
                    top: pos.top,
                    right: pos.right,
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                    shadowColor: '#000',
                  },
                ]}>
                {actions.map((action, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.item,
                      i < actions.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.divider },
                    ]}
                    onPress={() => {
                      setVisible(false)
                      action.onPress()
                    }}>
                    <Ionicons
                      name={action.icon as any}
                      size={16}
                      color={action.destructive ? colors.error : colors.text}
                    />
                    <Text style={[styles.label, { color: action.destructive ? colors.error : colors.text }]}>
                      {action.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  menu: {
    position: 'absolute',
    minWidth: 170,
    borderRadius: radius.md,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    gap: spacing.sm,
  },
  label: {
    ...typography.bodyMedium,
  },
})
