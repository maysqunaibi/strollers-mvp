// src/App.jsx
import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  SimpleGrid,
  HStack,
  VStack,
  Input,
  FormControl,
  FormLabel,
  Tag,
  TagLabel,
  Wrap,
  WrapItem,
  useToast,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import {
  RefreshCw,
  Sparkles,
  Link2,
  Unlink,
  Info,
  Activity,
  SlidersHorizontal,
  Coins,
  Package,
  PlusCircle,
  Building2,
  List,
  PenLine,
  Trash2,
  TerminalSquare,
} from "lucide-react";

// API layer
import {
  getSiteSlots,
  getSiteMeals,
  getDefaultMeals,
  saveMeals,
  bindDevice,
  unbindDevice,
  getDeviceInfo,
  getDeviceStatus,
  getDeviceParams,
  addScore,
  addSite,
  listSites,
  updateSite,
  removeSite,
} from "./lib/api";
import CustomerPanels from "./components/CustomerPanels";

const MotionCard = motion(Card);

function Tile({ title, icon: Icon, onClick, active }) {
  return (
    <MotionCard
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      cursor="pointer"
      onClick={onClick}
      bg={active ? "purple.600" : "white"}
      color={active ? "white" : "gray.900"}
      shadow="lg"
      borderWidth="1px"
      borderColor={active ? "purple.600" : "gray.200"}
      rounded="2xl"
    >
      <CardBody>
        <HStack spacing={3} align="center">
          <Box
            bg={active ? "whiteAlpha.300" : "purple.50"}
            rounded="xl"
            p={2}
            color={active ? "white" : "purple.600"}
          >
            <Icon size={20} />
          </Box>
          <Heading size="sm" noOfLines={1}>
            {title}
          </Heading>
        </HStack>
      </CardBody>
    </MotionCard>
  );
}

function Field({ label, children }) {
  return (
    <FormControl>
      <FormLabel fontSize="sm" color="gray.700">
        {label}
      </FormLabel>
      {children}
    </FormControl>
  );
}

function SlotPill({ s, onClick }) {
  const tone = s.status === "FREE" ? "green" : "orange";
  return (
    <WrapItem>
      <Tag
        size="lg"
        variant="subtle"
        colorScheme={tone}
        cursor="pointer"
        onClick={() => onClick(String(s.orders))}
      >
        <TagLabel>
          {s.status === "FREE" ? "FREE" : "REGISTER"} · {s.orders}
        </TagLabel>
      </Tag>
    </WrapItem>
  );
}

function MealPill({ m, onClick }) {
  return (
    <WrapItem>
      <Tag
        size="lg"
        variant="subtle"
        colorScheme="purple"
        cursor="pointer"
        onClick={() => onClick(String(m.coin))}
      >
        <TagLabel>
          {m.setMealName} · {m.amount}元 / {m.coin}币
        </TagLabel>
      </Tag>
    </WrapItem>
  );
}

function OperatorPanels() {
  const defaultSite = useMemo(
    () => new URLSearchParams(location.search).get("siteNo") || "",
    []
  );
  const [siteNo, setSiteNo] = useState(defaultSite);
  const [deviceNo, setDeviceNo] = useState("");
  const [orders, setOrders] = useState("");
  const [coinsPerTime, setCoinsPerTime] = useState("");
  const [slots, setSlots] = useState([]);
  const [meals, setMeals] = useState([]);
  const [showConsole, setShowConsole] = useState(false);
  const [log, setLog] = useState("Ready.");
  const toast = useToast();

  const logJSON = (obj) => setLog(JSON.stringify(obj, null, 2));

  async function loadAvailability() {
    if (!siteNo) return toast({ status: "warning", title: "Enter siteNo" });
    try {
      const [slotsRes, mealsRes] = await Promise.all([
        getSiteSlots(siteNo),
        getSiteMeals(siteNo),
      ]);
      setSlots(slotsRes?.data || []);
      setMeals(mealsRes?.data?.setMealList || []);
      logJSON({ slotsRes, mealsRes });
      toast({ status: "success", title: "Loaded" });
    } catch (e) {
      logJSON({ error: String(e) });
      toast({ status: "error", title: "Load failed" });
    }
  }

  async function handleBind() {
    if (!siteNo || !deviceNo || !orders || !coinsPerTime)
      return toast({ status: "warning", title: "Fill all fields" });
    try {
      const res = await bindDevice({
        siteNo,
        deviceNo,
        orders: Number(orders),
        coinsPerTime: Number(coinsPerTime),
      });
      logJSON(res);
      await loadAvailability();
      toast({ status: "success", title: "Bind sent" });
    } catch (e) {
      logJSON({ error: String(e) });
      toast({ status: "error", title: "Bind failed" });
    }
  }

  async function handleUnbind() {
    if (!deviceNo) return toast({ status: "warning", title: "Enter deviceNo" });
    try {
      const res = await unbindDevice({ deviceNo });
      logJSON(res);
      await loadAvailability();
      toast({ status: "success", title: "Unbind sent" });
    } catch (e) {
      logJSON({ error: String(e) });
      toast({ status: "error", title: "Unbind failed" });
    }
  }

  async function handleDeviceInfo() {
    if (!deviceNo) return toast({ status: "warning", title: "Enter deviceNo" });
    try {
      logJSON(await getDeviceInfo(deviceNo));
    } catch (e) {
      logJSON({ error: String(e) });
    }
  }
  async function handleDeviceStatus() {
    if (!deviceNo) return toast({ status: "warning", title: "Enter deviceNo" });
    try {
      logJSON(await getDeviceStatus(deviceNo));
    } catch (e) {
      logJSON({ error: String(e) });
    }
  }
  async function handleDeviceParams() {
    if (!deviceNo) return toast({ status: "warning", title: "Enter deviceNo" });
    try {
      logJSON(await getDeviceParams(deviceNo));
    } catch (e) {
      logJSON({ error: String(e) });
    }
  }
  async function handleScore() {
    if (!deviceNo) return toast({ status: "warning", title: "Enter deviceNo" });
    const coinNum = Number(prompt("Coin number to add?", "1") || "");
    if (!coinNum) return;
    try {
      logJSON(await addScore({ deviceNo, coinNum, amount: coinNum }));
    } catch (e) {
      logJSON({ error: String(e) });
    }
  }

  async function handleDefaultMeals() {
    if (!siteNo) return toast({ status: "warning", title: "Enter siteNo" });
    try {
      logJSON(await getDefaultMeals(siteNo));
    } catch (e) {
      logJSON({ error: String(e) });
    }
  }
  async function handleSaveMeal() {
    if (!siteNo) return toast({ status: "warning", title: "Enter siteNo" });
    const setMealName = prompt("Set meal name?", "启动套餐(自定义)");
    const amount = Number(prompt("Amount (元)?", "3") || "");
    const coin = Number(prompt("Coins?", "3") || "");
    if (!setMealName || !amount || !coin) return;
    try {
      const res = await saveMeals({
        siteNo,
        setMeals: [{ setMealName, amount, coin, status: "ENABLE" }],
        siteOrderType: "LAUNCH",
        type: "SITE",
      });
      logJSON(res);
      await loadAvailability();
      toast({ status: "success", title: "Meal saved" });
    } catch (e) {
      logJSON({ error: String(e) });
      toast({ status: "error", title: "Save failed" });
    }
  }

  async function handleAddSite() {
    const siteName = prompt("Site name?", "Demo Site");
    const province = prompt("Province?", "");
    const city = prompt("City?", "");
    const county = prompt("County?", "");
    const address = prompt("Address?", "");
    const siteType = prompt("Site type? (SHOPPING_MALL etc.)", "SHOPPING_MALL");
    if (!siteName || !province || !city || !county || !address || !siteType)
      return;
    try {
      logJSON(
        await addSite({ siteName, province, city, county, address, siteType })
      );
    } catch (e) {
      logJSON({ error: String(e) });
    }
  }
  async function handleListSites() {
    try {
      logJSON(await listSites());
    } catch (e) {
      logJSON({ error: String(e) });
    }
  }
  async function handleUpdateSite() {
    if (!siteNo) return toast({ status: "warning", title: "Enter siteNo" });
    const siteName = prompt("New site name?", "Updated Site Name");
    const province = prompt("Province?", "");
    const city = prompt("City?", "");
    const county = prompt("County?", "");
    const address = prompt("Address?", "");
    const siteType = prompt("Site type? (SHOPPING_MALL)", "SHOPPING_MALL");
    if (!siteName || !province || !city || !county || !address) return;
    try {
      logJSON(
        await updateSite({
          siteNo,
          siteName,
          province,
          city,
          county,
          address,
          siteType,
        })
      );
    } catch (e) {
      logJSON({ error: String(e) });
    }
  }
  async function handleRemoveSite() {
    if (!siteNo) return toast({ status: "warning", title: "Enter siteNo" });
    if (!confirm(`Remove site ${siteNo}?`)) return;
    try {
      logJSON(await removeSite({ siteNo }));
    } catch (e) {
      logJSON({ error: String(e) });
    }
  }

  const [open, setOpen] = useState("site"); // which detail card to show

  return (
    <VStack align="stretch" spacing={5}>
      {/* Tiles */}
      <SimpleGrid columns={{ base: 2, md: 5 }} spacing={4}>
        <Tile
          title="Device Ops"
          icon={SlidersHorizontal}
          onClick={() => setOpen("device")}
          active={open === "device"}
        />
        <Tile
          title="Set Meals"
          icon={Package}
          onClick={() => setOpen("meal")}
          active={open === "meal"}
        />
        <Tile
          title="Sites CRUD"
          icon={Building2}
          onClick={() => setOpen("crud")}
          active={open === "crud"}
        />
        <Tile
          title="Console"
          icon={TerminalSquare}
          onClick={() => setShowConsole(!showConsole)}
          active={showConsole}
        />
      </SimpleGrid>
      {/* Details */}(
      <Card variant="outline" rounded="2xl">
        <CardHeader>
          <Heading size="md">Site Overview</Heading>
        </CardHeader>
        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
            <Field label="Site No">
              <Input
                value={siteNo}
                onChange={(e) => setSiteNo(e.target.value)}
                placeholder="S001585"
              />
            </Field>
            <Field label="Device No">
              <Input
                value={deviceNo}
                onChange={(e) => setDeviceNo(e.target.value)}
                placeholder="01007008"
              />
            </Field>
            <Field label="Slot (orders)">
              <Input
                value={orders}
                onChange={(e) => setOrders(e.target.value)}
                placeholder="1"
              />
            </Field>
          </SimpleGrid>

          <HStack spacing={3} mt={4}>
            <Button
              leftIcon={<RefreshCw size={16} />}
              onClick={loadAvailability}
            >
              Load
            </Button>
            <Button
              leftIcon={<Sparkles size={16} />}
              variant="outline"
              onClick={handleDefaultMeals}
            >
              Default Meals
            </Button>
          </HStack>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mt={5}>
            <Box borderWidth="1px" rounded="xl" p={3}>
              <Heading size="sm" mb={2}>
                Slots
              </Heading>
              {slots.length === 0 ? (
                <Text fontSize="sm" color="gray.500">
                  No data
                </Text>
              ) : (
                <Wrap>
                  {slots.map((s, i) => (
                    <SlotPill key={i} s={s} onClick={setOrders} />
                  ))}
                </Wrap>
              )}
            </Box>
            <Box borderWidth="1px" rounded="xl" p={3}>
              <Heading size="sm" mb={2}>
                Packages (LAUNCH)
              </Heading>
              {meals.length === 0 ? (
                <Text fontSize="sm" color="gray.500">
                  No data
                </Text>
              ) : (
                <Wrap>
                  {meals.map((m, i) => (
                    <MealPill key={i} m={m} onClick={setCoinsPerTime} />
                  ))}
                </Wrap>
              )}
            </Box>
          </SimpleGrid>
        </CardBody>
      </Card>
      )
      {open === "device" && (
        <Card variant="outline" rounded="2xl">
          <CardHeader>
            <Heading size="md">Device Operations</Heading>
          </CardHeader>
          <CardBody>
            <HStack spacing={3} wrap="wrap">
              <Button
                colorScheme="purple"
                leftIcon={<Link2 size={16} />}
                onClick={handleBind}
              >
                Bind (install)
              </Button>
              <Button leftIcon={<Unlink size={16} />} onClick={handleUnbind}>
                Unbind (remove)
              </Button>
              <Button leftIcon={<Info size={16} />} onClick={handleDeviceInfo}>
                Device Info
              </Button>
              <Button
                leftIcon={<Activity size={16} />}
                onClick={handleDeviceStatus}
              >
                Device Status
              </Button>
              <Button
                leftIcon={<SlidersHorizontal size={16} />}
                onClick={handleDeviceParams}
              >
                Device Params
              </Button>
              <Button leftIcon={<Coins size={16} />} onClick={handleScore}>
                Score (+coins)
              </Button>
            </HStack>
          </CardBody>
        </Card>
      )}
      {open === "meal" && (
        <Card variant="outline" rounded="2xl">
          <CardHeader>
            <Heading size="md">Set Meal (套餐)</Heading>
          </CardHeader>
          <CardBody>
            <HStack spacing={3} wrap="wrap">
              <Button
                leftIcon={<List size={16} />}
                variant="outline"
                onClick={loadAvailability}
              >
                Query (site)
              </Button>
              <Button
                leftIcon={<Sparkles size={16} />}
                variant="outline"
                onClick={handleDefaultMeals}
              >
                Default Meals
              </Button>
              <Button
                leftIcon={<PlusCircle size={16} />}
                onClick={handleSaveMeal}
              >
                Save Meal
              </Button>
            </HStack>
          </CardBody>
        </Card>
      )}
      {open === "crud" && (
        <Card variant="outline" rounded="2xl">
          <CardHeader>
            <Heading size="md">Site Management</Heading>
          </CardHeader>
          <CardBody>
            <HStack spacing={3} wrap="wrap">
              <Button
                leftIcon={<Building2 size={16} />}
                onClick={handleAddSite}
              >
                Add Site
              </Button>
              <Button
                leftIcon={<List size={16} />}
                variant="outline"
                onClick={handleListSites}
              >
                Get Site List
              </Button>
              <Button
                leftIcon={<PenLine size={16} />}
                variant="outline"
                onClick={handleUpdateSite}
              >
                Update Site
              </Button>
              <Button
                leftIcon={<Trash2 size={16} />}
                colorScheme="red"
                onClick={handleRemoveSite}
              >
                Remove Site
              </Button>
            </HStack>
          </CardBody>
        </Card>
      )}
      {showConsole && (
        <Card variant="outline" rounded="2xl">
          <CardHeader>
            <Heading size="md">Console</Heading>
          </CardHeader>
          <CardBody>
            <Box
              as="pre"
              fontSize="xs"
              p={3}
              bg="gray.50"
              borderWidth="1px"
              rounded="xl"
              maxH="60vh"
              overflow="auto"
            >
              {log}
            </Box>
            <Text fontSize="xs" color="gray.500" mt={2}>
              Tip: Copy JSON from here when reporting issues to the vendor.
            </Text>
          </CardBody>
        </Card>
      )}
      <Box borderTopWidth="1px" borderColor="gray.200" />
      <Text fontSize="xs" color="gray.500">
        Note: In real rentals, devices stay <b>REGISTER</b> (bound). Customer
        flow will use lock/unlock + order APIs when provided by vendor.
        Bind/Unbind here are for installation.
      </Text>
    </VStack>
  );
}

export default function App() {
  const [tab, setTab] = useState("operator");
  return (
    <Box
      minH="100vh"
      bgGradient="linear(to-b, gray.50, white)"
      color="gray.900"
    >
      <Box
        position="sticky"
        top={0}
        zIndex={10}
        borderBottomWidth="1px"
        bg="whiteAlpha.80"
        backdropFilter="saturate(180%) blur(8px)"
      >
        <Box
          maxW="6xl"
          mx="auto"
          px={4}
          py={3}
          display="flex"
          alignItems="center"
          gap={3}
        >
          <Heading
            size="md"
            bgClip="text"
            bgGradient="linear(to-r, purple.600, indigo.600)"
          >
            <Text color="gray.500">Shared Strollers – MVP</Text>
          </Heading>
          <HStack spacing={2} ml="auto">
            <Button
              variant={tab === "operator" ? "solid" : "outline"}
              colorScheme="purple"
              size="sm"
              onClick={() => setTab("operator")}
            >
              Operator
            </Button>
            <Button
              variant={tab === "customer" ? "solid" : "outline"}
              colorScheme="purple"
              size="sm"
              onClick={() => setTab("customer")}
            >
              Customer
            </Button>
          </HStack>
        </Box>
      </Box>

      <Box maxW="6xl" mx="auto" p={{ base: 4, md: 6 }}>
        {tab === "operator" ? (
          <OperatorPanels />
        ) : (
          <CustomerPanels />
          // <VStack align="stretch" spacing={5}>
          //   <Card variant="outline" rounded="2xl">
          //     <CardHeader>
          //       <Heading size="md">Customer Flow (Coming Soon)</Heading>
          //     </CardHeader>
          //     <CardBody>
          //       <ol style={{ marginLeft: "1rem" }}>
          //         <li>
          //           Scan QR → Site page loads with available REGISTER slots.
          //         </li>
          //         <li>Select package → Create order → Payment.</li>
          //         <li>
          //           On success → <b>Open lock</b> to start rental.
          //         </li>
          //         <li>
          //           On return → <b>Close lock</b> + settle order.
          //         </li>
          //       </ol>
          //     </CardBody>
          //   </Card>
          // </VStack>
        )}
      </Box>
    </Box>
  );
}
