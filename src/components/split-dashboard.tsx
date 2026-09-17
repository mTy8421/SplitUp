import { Children, type ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Avatar,
  Button,
  Card,
  colors,
  fonts,
  Icon,
  s,
  type IconName,
} from "./split-ui";
import { money, type Trip } from "@/lib/engine";

export type AppTab = "home" | "expenses" | "summary" | "members" | "history";
const nav: { id: AppTab; icon: IconName; label: string }[] = [
  { id: "home", icon: "home", label: "หน้าหลัก" },
  { id: "expenses", icon: "receipt", label: "ค่าใช้จ่าย" },
  { id: "summary", icon: "transfer", label: "สรุปยอด" },
  { id: "members", icon: "users", label: "สมาชิก" },
];
export function AppShell({
  tab,
  onTab,
  onData,
  busy,
  status,
  children,
}: {
  tab: AppTab;
  onTab: (tab: AppTab) => void;
  onData: () => void;
  busy: boolean;
  status: string;
  children: ReactNode;
}) {
  const { width } = useWindowDimensions();
  const desktop = width >= 1100;
  const compact = width < 600;
  const brand = (
    <View style={[s.row, { gap: 10 }]}>
      <View style={d.brandMark}>
        <Icon name="transfer" color="#fff" size={23} />
      </View>
      <View>
        <Text
          style={{
            fontFamily: fonts.bold,
            fontSize: 24,
            color: colors.ink,
            letterSpacing: -1,
          }}
        >
          SplitUp<Text style={{ color: colors.green }}>.</Text>
        </Text>
        <Text style={[s.muted, { fontSize: 10, letterSpacing: 1.2 }]}>
          หารกัน ให้ทุกทริปลงตัว
        </Text>
      </View>
    </View>
  );
  const navItem = (item: (typeof nav)[number], bottom = false) => (
    <Pressable
      key={item.id}
      accessibilityRole="tab"
      accessibilityLabel={item.label}
      accessibilityState={{ selected: tab === item.id }}
      onPress={() => onTab(item.id)}
      style={({ pressed }) => [
        bottom ? d.bottomItem : d.navItem,
        !bottom && tab === item.id && { backgroundColor: colors.pale },
        pressed && { opacity: 0.65 },
      ]}
    >
      <View style={bottom && tab === item.id ? d.activeIcon : undefined}>
        <Icon
          name={item.icon}
          size={21}
          color={tab === item.id ? colors.green : "#87938A"}
        />
      </View>
      <Text
        style={{
          fontFamily: tab === item.id ? fonts.semibold : fonts.regular,
          fontSize: bottom ? 11 : 14,
          color: tab === item.id ? colors.green : colors.muted,
        }}
      >
        {item.label}
      </Text>
      {!bottom && tab === item.id && <View style={d.activeDot} />}
    </Pressable>
  );
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: desktop ? colors.bg : "#fff" }}
    >
      <View style={{ flex: 1, flexDirection: "row" }}>
        {desktop && (
          <ScrollView
            testID="desktop-sidebar"
            style={d.sidebar}
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: 22,
              paddingVertical: 30,
            }}
          >
            {brand}
            <Text
              style={[
                s.eyebrow,
                { marginTop: 42, marginBottom: 14, paddingLeft: 16 },
              ]}
            >
              พื้นที่ของคุณ
            </Text>
            <View style={{ gap: 7 }}>
              {nav.map((item) => navItem(item))}
              <View
                style={{
                  height: 1,
                  backgroundColor: colors.border,
                  marginVertical: 16,
                }}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="ทริปทั้งหมด"
                onPress={() => onTab("history")}
                style={[
                  d.navItem,
                  tab === "history" && { backgroundColor: colors.pale },
                ]}
              >
                <Icon name="archive" />
                <Text style={s.label}>ทริปทั้งหมด</Text>
              </Pressable>
            </View>
            <View style={{ flex: 1 }} />
            <View style={d.sidebarNote}>
              <Icon name="leaf" size={24} />
              <Text style={s.heading}>เรื่องเงินชัดเจน</Text>
              <Text style={s.muted}>เก็บความทรงจำดี ๆ\nให้ทริปถัดไปของคุณ</Text>
            </View>
            <Button
              title="สำรอง / ย้ายข้อมูล"
              secondary
              icon="archive"
              onPress={onData}
            />
            <Text
              style={[
                s.muted,
                { fontSize: 10, marginTop: 16, textAlign: "center" },
              ]}
            >
              SplitUp · พื้นที่เล็ก ๆ ของทุกทริป
            </Text>
          </ScrollView>
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={[d.topbar, { paddingHorizontal: compact ? 18 : 32 }]}>
            {desktop ? (
              <View style={s.row}>
                <Text style={s.muted}>พื้นที่ของคุณ</Text>
                <Icon name="chevron" size={12} color="#A1ABA2" />
                <Text style={s.label}>
                  {tab === "history"
                    ? "ทริปทั้งหมด"
                    : nav.find((n) => n.id === tab)?.label}
                </Text>
              </View>
            ) : (
              brand
            )}
            {desktop ? (
              <View style={[s.row, { gap: 7 }]}>
                <View style={d.statusDot} />
                <Text accessibilityLiveRegion="polite" style={s.muted}>
                  {busy ? "กำลังบันทึก…" : status}
                </Text>
              </View>
            ) : (
              <Button
                title="ทริปทั้งหมด"
                secondary
                onPress={() => onTab("history")}
              />
            )}
          </View>
          <ScrollView
            testID="main-scroll"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              padding: compact ? 18 : 32,
              paddingBottom: compact ? 24 : 36,
              gap: 24,
              alignItems: "center",
            }}
            style={{ flex: 1, backgroundColor: colors.bg }}
          >
            <View
              style={{ width: "100%", maxWidth: 1180, gap: compact ? 20 : 28 }}
            >
              {children}
              <View
                style={[
                  s.row,
                  {
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    paddingTop: 8,
                  },
                ]}
              >
                <View style={[s.row, { gap: 6 }]}>
                  <Icon name="leaf" size={14} color={colors.muted} />
                  <Text style={[s.muted, { fontSize: 11 }]}>
                    แบ่งค่าใช้จ่าย เก็บความทรงจำ
                  </Text>
                </View>
                {!desktop && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="สำรอง / ย้ายข้อมูล"
                    onPress={onData}
                    style={{ minHeight: 44, justifyContent: "center" }}
                  >
                    <Text
                      style={[s.muted, { color: colors.green, fontSize: 11 }]}
                    >
                      สำรอง / ย้ายข้อมูล
                    </Text>
                  </Pressable>
                )}
              </View>
              {!desktop && (
                <Text
                  accessibilityLiveRegion="polite"
                  style={[s.muted, { fontSize: 10 }]}
                >
                  {busy ? "กำลังบันทึก…" : status}
                </Text>
              )}
            </View>
          </ScrollView>
          {!desktop && (
            <View testID="bottom-navigation" style={d.bottomNav}>
              {nav.map((item) => navItem(item, true))}
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
export function PageHeader({
  trip,
  onShare,
}: {
  trip: Trip;
  onShare: () => void;
}) {
  const { width } = useWindowDimensions();
  const compact = width < 600;
  return (
    <View
      style={[
        s.row,
        {
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
        },
      ]}
    >
      <View style={{ flex: 1, minWidth: 180, gap: 6 }}>
        <Text style={s.eyebrow}>ทริปของคุณ / YOUR TRIP</Text>
        <Text
          accessibilityRole="header"
          style={[s.title, { fontSize: compact ? 26 : 32 }]}
        >
          {trip.name}
        </Text>
        <View style={[s.row, { gap: 7, flexWrap: "wrap" }]}>
          <Icon name="calendar" size={14} color={colors.muted} />
          <Text style={s.muted}>
            {new Date(trip.date + "T12:00:00").toLocaleDateString("th-TH", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </Text>
          <Text style={{ color: "#C3CDC3" }}>·</Text>
          <Icon name="users" size={15} color={colors.muted} />
          <Text style={s.muted}>{trip.members.length} คนร่วมทริป</Text>
        </View>
      </View>
      <Button title="แชร์สรุป" secondary icon="share" onPress={onShare} />
    </View>
  );
}
export function Grid({ children }: { children: ReactNode }) {
  const { width } = useWindowDimensions();
  const columns = width >= 700 ? 2 : 1;
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
      {Children.toArray(children).map((child, i) => (
        <View
          key={i}
          style={{
            width: columns === 1 ? "100%" : undefined,
            flexBasis: columns === 1 ? undefined : "47%",
            flexGrow: 1,
            minWidth: 0,
          }}
        >
          {child}
        </View>
      ))}
    </View>
  );
}
export function Overview({
  trip,
  total,
  transfers,
  onAdd,
  onSummary,
  onExpenses,
  expenseList,
  busy,
}: {
  trip: Trip;
  total: number;
  transfers: { from: string; to: string; amount: number }[];
  onAdd: () => void;
  onSummary: () => void;
  onExpenses: () => void;
  expenseList: ReactNode;
  busy: boolean;
}) {
  const { width } = useWindowDimensions();
  const compact = width < 600;
  const columns = width >= 900;
  const outstanding = transfers.reduce((n, t) => n + t.amount, 0);
  const progress =
    trip.settlements.length + transfers.length === 0
      ? 0
      : trip.settlements.length / (trip.settlements.length + transfers.length);
  return (
    <View style={{ gap: 24 }}>
      <View
        testID="overview-stats"
        style={{ flexDirection: compact ? "column" : "row", gap: 16 }}
      >
        <View
          style={[
            d.hero,
            { flex: compact ? undefined : 1.65, padding: compact ? 24 : 30 },
          ]}
        >
          <View pointerEvents="none" style={d.heroCircle} />
          <View
            pointerEvents="none"
            style={[
              d.heroCircle,
              { width: 200, height: 200, right: -66, top: 65 },
            ]}
          />
          <View style={[s.row, { justifyContent: "space-between" }]}>
            <View style={[s.row, { gap: 8 }]}>
              <Icon name="wallet" color="#CDE5D3" size={18} />
              <Text
                style={{
                  fontFamily: fonts.medium,
                  color: "#DDEDE1",
                  fontSize: 13,
                }}
              >
                ค่าใช้จ่ายรวมของทริป
              </Text>
            </View>
            <Text style={d.currency}>THB</Text>
          </View>
          <Text
            style={{
              fontFamily: fonts.semibold,
              fontSize: compact ? (money(total).length > 12 ? 24 : 38) : 46,
              letterSpacing: -1,
              color: "#fff",
              marginTop: 12,
            }}
          >
            ฿{money(total)}
          </Text>
          <View
            style={[
              s.row,
              {
                justifyContent: "space-between",
                flexWrap: "wrap",
                marginTop: 10,
              },
            ]}
          >
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 12,
                color: "#CDE5D3",
              }}
            >
              {trip.expenses.length} รายการ · ทุกความสุข หารกันได้
            </Text>
            <View style={[s.row, { gap: 4 }]}>
              <Icon name="check" size={13} color="#CDE5D3" />
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 10,
                  color: "#CDE5D3",
                }}
              >
                THB / บาท
              </Text>
            </View>
          </View>
        </View>
        <View
          style={{
            flex: compact ? undefined : 1,
            flexDirection: compact ? "row" : "column",
            gap: 14,
          }}
        >
          <Card
            style={{
              flex: 1,
              padding: compact ? 14 : 18,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            {!compact && (
              <View style={[d.statIcon, { backgroundColor: "#F1EBDF" }]}>
                <Icon name="users" color="#978052" size={21} />
              </View>
            )}
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.muted}>เฉลี่ยต่อคน</Text>
              <Text style={[s.heading, { fontSize: compact ? 17 : 22 }]}>
                ฿{money(Math.round(total / trip.members.length))}
              </Text>
            </View>
          </Card>
          <Card
            style={{
              flex: 1,
              padding: compact ? 14 : 18,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            {!compact && (
              <View style={d.statIcon}>
                <Icon name="receipt" size={21} />
              </View>
            )}
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.muted}>ค่าใช้จ่ายทั้งหมด</Text>
              <Text style={[s.heading, { fontSize: compact ? 18 : 22 }]}>
                {trip.expenses.length}
                <Text style={s.muted}> รายการ</Text>
              </Text>
            </View>
          </Card>
        </View>
      </View>
      <View
        style={{
          flexDirection: columns ? "row" : "column",
          gap: 22,
          alignItems: "stretch",
        }}
      >
        <View
          style={{ flex: columns ? 1.65 : undefined, minWidth: 0, gap: 16 }}
        >
          <View
            style={[
              s.row,
              { justifyContent: "space-between", flexWrap: "wrap" },
            ]}
          >
            <View>
              <Text style={s.heading}>ค่าใช้จ่ายล่าสุด</Text>
              <Text style={s.muted}>ทุกรายการของทริป อยู่ตรงนี้</Text>
            </View>
            <Button title="+ เพิ่มค่าใช้จ่าย" disabled={busy} onPress={onAdd} />
          </View>
          <View
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 20,
              backgroundColor: "#fff",
              overflow: "hidden",
            }}
          >
            {expenseList}
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={onExpenses}
            style={{
              minHeight: 44,
              alignSelf: "center",
              flexDirection: "row",
              gap: 8,
              alignItems: "center",
            }}
          >
            <Text style={[s.label, { fontSize: 12, color: colors.green }]}>
              ดูค่าใช้จ่ายทั้งหมด
            </Text>
            <Icon name="arrow" size={15} />
          </Pressable>
        </View>
        <View style={{ flex: columns ? 1 : undefined, minWidth: 0, gap: 18 }}>
          <Card>
            <View style={[s.row, { gap: 9 }]}>
              <Icon name="transfer" size={19} />
              <Text style={s.heading}>สรุปการโอน</Text>
            </View>
            <Text style={s.muted}>
              {transfers.length
                ? "เคลียร์ยอดให้ลงตัว แล้วไปเที่ยวต่อ"
                : "ไม่มียอดค้างชำระในทริปนี้"}
            </Text>
            <View
              style={{
                padding: 16,
                borderRadius: 14,
                backgroundColor: "#F3F7EF",
                gap: 4,
              }}
            >
              <Text style={s.muted}>ยอดค้างชำระรวม</Text>
              <Text
                style={[
                  s.title,
                  {
                    fontSize: money(outstanding).length > 12 ? 22 : 28,
                    color: colors.green,
                  },
                ]}
              >
                ฿{money(outstanding)}
              </Text>
              <Text style={[s.muted, { fontSize: 11 }]}>
                {transfers.length} รายการที่ต้องโอน
              </Text>
            </View>
            {transfers.slice(0, 2).map((t, i) => (
              <View
                key={t.from + t.to}
                style={[s.row, { gap: 8, alignItems: "flex-start" }]}
              >
                <Avatar
                  name={trip.members.find((m) => m.id === t.from)?.name || "?"}
                  index={i + 1}
                  size={30}
                />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[s.label, { fontSize: 12 }]}>
                    {trip.members.find((m) => m.id === t.from)?.name} →{" "}
                    {trip.members.find((m) => m.id === t.to)?.name}
                  </Text>
                  <Text
                    style={[s.label, { fontSize: 13, color: colors.green }]}
                  >
                    ฿{money(t.amount)}
                  </Text>
                </View>
              </View>
            ))}
            <View style={{ gap: 8 }}>
              <View style={[s.row, { justifyContent: "space-between" }]}>
                <Text style={[s.muted, { fontSize: 11 }]}>
                  ชำระแล้ว {trip.settlements.length} รายการ
                </Text>
                <Text style={[s.muted, { fontSize: 11 }]}>
                  {Math.round(progress * 100)}%
                </Text>
              </View>
              <View
                style={{
                  height: 5,
                  borderRadius: 3,
                  backgroundColor: "#EAF0E7",
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    height: 5,
                    width: `${progress * 100}%`,
                    backgroundColor: colors.green,
                    borderRadius: 3,
                  }}
                />
              </View>
            </View>
            <Button title="ดูสรุปยอดทั้งหมด" secondary onPress={onSummary} />
          </Card>
          <Card style={{ backgroundColor: "#F0F3EB", borderColor: "#E4EADA" }}>
            <View style={[s.row, { justifyContent: "space-between" }]}>
              <Text style={s.label}>เพื่อนร่วมทริป</Text>
              <Text style={s.muted}>{trip.members.length} คน</Text>
            </View>
            <View style={[s.row, { gap: 0 }]}>
              {trip.members.slice(0, 5).map((m, i) => (
                <View key={m.id} style={{ marginLeft: i ? -7 : 0 }}>
                  <Avatar name={m.name} index={i} size={36} />
                </View>
              ))}
              {trip.members.length > 5 && (
                <Text style={[s.muted, { marginLeft: 8 }]}>
                  +{trip.members.length - 5}
                </Text>
              )}
            </View>
            <Text style={[s.muted, { fontSize: 11 }]}>
              คนละนิด คนละหน่อย ความสุขเต็มทริป
            </Text>
          </Card>
        </View>
      </View>
    </View>
  );
}
const d = StyleSheet.create({
  brandMark: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
  },
  sidebar: {
    width: 240,
    flexGrow: 0,
    flexShrink: 0,
    borderRightWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#fff",
  },
  navItem: {
    minHeight: 50,
    flexDirection: "row",
    gap: 13,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.green,
    marginLeft: "auto",
  },
  sidebarNote: {
    backgroundColor: colors.bg,
    borderRadius: 16,
    padding: 18,
    gap: 8,
    marginBottom: 20,
  },
  topbar: {
    minHeight: 84,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#fff",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#6A9D6C",
  },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingTop: 6,
    paddingBottom: 4,
  },
  bottomItem: {
    flex: 1,
    minHeight: 66,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 2,
  },
  activeIcon: {
    backgroundColor: colors.pale,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 3,
    marginTop: -3,
    marginBottom: -3,
  },
  hero: {
    backgroundColor: "#246C50",
    borderRadius: 22,
    overflow: "hidden",
    justifyContent: "center",
    minHeight: 190,
  },
  heroCircle: {
    position: "absolute",
    height: 270,
    width: 270,
    borderRadius: 135,
    borderWidth: 1,
    borderColor: "#488468",
    right: -60,
    top: -125,
  },
  currency: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: "#E4EFE3",
    borderWidth: 1,
    borderColor: "#5D9076",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
  },
  statIcon: {
    height: 40,
    width: 40,
    borderRadius: 13,
    backgroundColor: colors.pale,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});
