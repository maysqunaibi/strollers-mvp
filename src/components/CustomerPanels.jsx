import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  SimpleGrid,
  HStack,
  VStack,
  Image,
  Badge,
  Button,
  useToast,
  Spinner,
  Divider,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import {
  getDeviceInfo,
  getCartList,
  getSiteMeals,
  unlockCart,
} from "../lib/api";
import stroller from "../assets/stroller.webp";
const MotionCard = motion(Card);

// tiny helper to read query param
function useQueryParam(key) {
  return useMemo(
    () => new URLSearchParams(window.location.search).get(key) || "",
    []
  );
}

// map vendor Chinese names to English + SAR/points presentation
function formatMeal(m) {
  const name = (m?.setMealName || "").trim();
  const map = {
    推荐启动套餐: "Recommended",
    启动套餐1: "Starter 1",
    启动套餐2: "Starter 2",
    启动套餐3: "Starter 3",
    启动套餐4: "Starter 4",
    启动套餐5: "Starter 5",
    启动套餐6: "Starter 6",
  };
  const displayName = map[name] || name || "Package";
  // treat amount as SAR and coin as points for display only
  return {
    label: `${displayName} • ${Number(m.amount)} SAR / ${Number(m.coin)} pts`,
    ...m,
  };
}

function CartCard({ cart, selected, onSelect }) {
  const available = cart.usedStatus && cart.cartNo; // has a cart & docked
  const img = available ? stroller : stroller;
  const tone = available ? "green" : "gray";

  return (
    <MotionCard
      onClick={() => available && onSelect(cart)}
      cursor={available ? "pointer" : "not-allowed"}
      borderWidth="1px"
      rounded="lg"
      whileHover={available ? { y: -3, scale: 1.01 } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      borderColor={selected ? "purple.500" : "gray.200"}
      shadow={selected ? "md" : "sm"}
      opacity={available ? 1 : 0.6}
    >
      <Image
        src={img}
        alt={available ? "Available" : "Not available"}
        h="90px"
        w="100%"
        objectFit="contain"
      />
      <CardBody py={3} px={3}>
        <HStack justify="space-between" align="center">
          <Heading size="sm">Cart #{cart.index}</Heading>
          <Badge colorScheme={tone}>
            {available ? "Available" : "Unavailable"}
          </Badge>
        </HStack>
        <Text fontSize="xs" color="gray.600" mt={1}>
          {cart.cartNo ? `IC: ${cart.cartNo}` : "No cart"}
        </Text>
      </CardBody>
    </MotionCard>
  );
}

function MealCard({ meal, selected, onSelect }) {
  const f = formatMeal(meal);
  return (
    <MotionCard
      onClick={() => onSelect(meal)}
      cursor="pointer"
      borderWidth="1px"
      rounded="lg"
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      borderColor={selected ? "purple.500" : "gray.200"}
      shadow={selected ? "md" : "sm"}
    >
      <CardBody py={3} px={3}>
        <Heading size="sm" noOfLines={2}>
          {f.label}
        </Heading>
        <Text fontSize="xs" color="gray.600" mt={1}>
          {meal.amountType === "decimal"
            ? "Precise pricing"
            : "Integer pricing"}
        </Text>
      </CardBody>
    </MotionCard>
  );
}

export default function CustomerPanels() {
  const toast = useToast();
  const urlDeviceNo = useQueryParam("deviceNo"); // read from QR link
  const [deviceNo, setDeviceNo] = useState(urlDeviceNo);
  const [siteNo, setSiteNo] = useState("");

  const [loading, setLoading] = useState(false);
  const [carts, setCarts] = useState([]);
  const [meals, setMeals] = useState([]);
  const [selectedCart, setSelectedCart] = useState(null);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [paying, setPaying] = useState(false);

  // 1) load device info → siteNo, then load carts & meals
  useEffect(() => {
    async function bootstrap() {
      if (!deviceNo) return;
      setLoading(true);
      try {
        const info = await getDeviceInfo(deviceNo);
        const _siteNo = info?.data?.siteNo || "";
        setSiteNo(_siteNo);

        // in parallel: carts + meals
        const [cartRes, mealRes] = await Promise.all([
          getCartList({ deviceNo }),
          _siteNo
            ? getSiteMeals(_siteNo)
            : Promise.resolve({ data: { setMealList: [] } }),
        ]);

        setCarts(cartRes?.data || []);
        setMeals(mealRes?.data?.setMealList || []);

        if (!_siteNo) {
          toast({
            status: "warning",
            title: "This device is not bound to a site yet.",
          });
        }
      } catch (e) {
        toast({ status: "error", title: "Failed to load device data" });
      } finally {
        setLoading(false);
      }
    }
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceNo]);

  // mock payment then unlock
  async function handlePayAndUnlock() {
    if (!deviceNo || !selectedCart || !selectedMeal) {
      return toast({
        status: "warning",
        title: "Select a stroller and a package",
      });
    }
    setPaying(true);

    try {
      // 2) Mock payment (replace with real gateway later)
      await new Promise((r) => setTimeout(r, 1200)); // pretend checkout

      // 3) Call unlock with BOTH cartNo and cartIndex (vendor requires both)
      const res = await unlockCart({
        deviceNo,
        cartNo: selectedCart.cartNo,
        cartIndex: selectedCart.index,
      });

      if (res?.code === "00000") {
        toast({
          status: "success",
          title: "Unlock sent! Please take your stroller.",
        });
        // Optionally refresh list
        const refreshed = await getCartList({ deviceNo });
        setCarts(refreshed?.data || []);
      } else {
        toast({ status: "error", title: res?.msg || "Unlock failed" });
      }
    } catch (e) {
      toast({ status: "error", title: "Payment/Unlock failed" });
    } finally {
      setPaying(false);
    }
  }

  return (
    <VStack align="stretch" spacing={5}>
      <Card variant="outline" rounded="2xl">
        <CardHeader>
          <Heading size="md">Rent a stroller</Heading>
          <Text fontSize="sm" color="gray.600" mt={1}>
            Device: <b>{deviceNo || "—"}</b>{" "}
            {siteNo ? (
              <>
                {" "}
                | Site: <b>{siteNo}</b>
              </>
            ) : null}
          </Text>
        </CardHeader>
        <CardBody>
          {loading ? (
            <HStack>
              <Spinner size="sm" />
              <Text>Loading...</Text>
            </HStack>
          ) : (
            <>
              {/* Carts */}
              <Heading size="sm" mb={2}>
                Choose a stroller
              </Heading>
              {!carts || carts.length === 0 ? (
                <Text fontSize="sm" color="gray.500">
                  No data
                </Text>
              ) : (
                <SimpleGrid minChildWidth="140px" spacing={3}>
                  {carts.map((c, i) => (
                    <CartCard
                      key={i}
                      cart={c}
                      selected={selectedCart?.index === c.index}
                      onSelect={setSelectedCart}
                    />
                  ))}
                </SimpleGrid>
              )}

              <Divider my={5} />

              {/* Packages */}
              <Heading size="sm" mb={2}>
                Choose a package
              </Heading>
              {!meals || meals.length === 0 ? (
                <Text fontSize="sm" color="gray.500">
                  No packages available for this site
                </Text>
              ) : (
                <SimpleGrid minChildWidth="180px" spacing={3}>
                  {meals.map((m, i) => (
                    <MealCard
                      key={i}
                      meal={m}
                      selected={
                        selectedMeal?.id === m.id && !!m.id
                          ? true
                          : selectedMeal?.orders === m.orders
                      }
                      onSelect={setSelectedMeal}
                    />
                  ))}
                </SimpleGrid>
              )}

              <HStack mt={5}>
                <Button
                  colorScheme="purple"
                  onClick={handlePayAndUnlock}
                  isLoading={paying}
                  isDisabled={!selectedCart || !selectedMeal}
                >
                  Pay & Unlock
                </Button>
                <Button
                  variant="ghost"
                  onClick={async () => {
                    const refreshed = await getCartList({ deviceNo });
                    setCarts(refreshed?.data || []);
                  }}
                >
                  Refresh
                </Button>
              </HStack>
            </>
          )}
        </CardBody>
      </Card>
    </VStack>
  );
}
