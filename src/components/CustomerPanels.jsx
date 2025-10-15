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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
} from "@chakra-ui/react";

import { motion } from "framer-motion";
import {
  getDeviceInfo,
  getCartList,
  getLocalPackages,
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

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = resolve;
    s.onerror = () => reject(new Error("Script load error: " + src));
    document.head.appendChild(s);
  });
}

function loadCss(href) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`link[href="${href}"]`)) return resolve();
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = href;
    l.onload = resolve;
    l.onerror = () => reject(new Error("CSS load error: " + href));
    document.head.appendChild(l);
  });
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

function PackageCard({ pckg, selected, onSelect }) {
  return (
    <MotionCard
      onClick={() => onSelect(pckg)}
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
          {pckg.name}
        </Heading>
        <Text fontSize="xs" color="gray.600" mt={1}>
          {pckg.amount_halalas / 100} SAR
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
  const [packages, setPackages] = useState([]);
  const [selectedCart, setSelectedCart] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [paying, setPaying] = useState(false);
  const [showPay, setShowPay] = useState(false);
  // 1) load device info → siteNo, then load carts & packages
  useEffect(() => {
    async function bootstrap() {
      if (!deviceNo) return;
      setLoading(true);
      try {
        const info = await getDeviceInfo(deviceNo);
        const _siteNo = info?.data?.siteNo || "S1001585";
        setSiteNo(_siteNo);

        // in parallel: carts + packages
        const [cartRes, pckgRes] = await Promise.all([
          getCartList({ deviceNo }),
          _siteNo ? getLocalPackages(_siteNo) : getLocalPackages(null),
        ]);

        setCarts(cartRes?.data || []);
        setPackages(pckgRes || []);

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
  async function ensureMoyasarLoaded() {
    // If already present, done
    if (window.Moyasar && typeof window.Moyasar.init === "function") return;

    // Add CSS once
    if (!document.querySelector('link[data-mysr="css"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href =
        "https://cdn.jsdelivr.net/npm/moyasar-payment-form@2.1.1/dist/moyasar.css";
      link.setAttribute("data-mysr", "css");
      document.head.appendChild(link);
    }

    // Add JS once
    if (!document.querySelector('script[data-mysr="js"]')) {
      await new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src =
          "https://cdn.jsdelivr.net/npm/moyasar-payment-form@2.1.1/dist/moyasar.umd.js";
        s.async = true;
        s.defer = true;
        s.setAttribute("data-mysr", "js");
        s.onload = resolve;
        s.onerror = () => reject(new Error("Failed to load Moyasar script"));
        document.head.appendChild(s);
      });
    }

    // final guard
    if (!window.Moyasar || typeof window.Moyasar.init !== "function") {
      throw new Error("Moyasar failed to initialize");
    }
  }

  // mock payment then unlock
  async function handlePayAndUnlock() {
    console.log("I'm being called");
    if (!deviceNo || !selectedCart || !selectedPackage) {
      return toast({
        status: "warning",
        title: "Select a stroller and a package",
      });
    }

    const amountHalalas = Number(selectedPackage.amount_halalas);

    // Save the selection for the return step
    localStorage.setItem(
      "pendingPaymentSelection",
      JSON.stringify({
        deviceNo,
        cartNo: selectedCart.cartNo,
        cartIndex: selectedCart.index,
        siteNo,
        amountHalalas,
      })
    );

    try {
      console.log("Loading Moyasar…");

      await ensureMoyasarLoaded();

      setShowPay(true);
      setTimeout(() => {
        console.log(
          "Moyasar loaded?",
          !!window.Moyasar,
          "init?",
          typeof window.Moyasar?.init
        );
        if (!window.Moyasar?.init) {
          toast({ status: "error", title: "Payment library failed to load" });
          return;
        }
        window.Moyasar.init({
          element: ".mysr-form",
          amount: amountHalalas, // integer, halalas
          currency: "SAR",
          description: `Stroller – Device ${deviceNo} / Cart ${selectedCart.index}`,
          publishable_api_key:
            "pk_test_Z6XdEAj9RNpPF8HKeDYi33kGZ1SZ7chu8tUvXXCt",
          callback_url: `${window.location.origin}/pay/return`,
          supported_networks: ["visa", "mastercard", "mada"],
          methods: ["creditcard", "applepay"],
          apple_pay: {
            country: "SA",
            label: "Rental Strollers",
            validate_merchant_url:
              "https://api.moyasar.com/v1/applepay/initiate",
          },
        });
      }, 0);
    } catch (err) {
      console.error(err);
      toast({ status: "error", title: "Could not load payment form" });
    }
  }

  return (
    <>
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
                {!packages || packages.length === 0 ? (
                  <Text fontSize="sm" color="gray.500">
                    No packages available for this site
                  </Text>
                ) : (
                  <SimpleGrid minChildWidth="180px" spacing={3}>
                    {packages.map((m, i) => (
                      <PackageCard
                        key={i}
                        pckg={m}
                        selected={
                          selectedPackage?.id === m.id && !!m.id
                            ? true
                            : selectedPackage?.display_order === m.display_order
                        }
                        onSelect={setSelectedPackage}
                      />
                    ))}
                  </SimpleGrid>
                )}

                <HStack mt={5}>
                  <Button
                    colorScheme="purple"
                    onClick={handlePayAndUnlock}
                    isLoading={paying}
                    isDisabled={!selectedCart || !selectedPackage}
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
      <Modal
        isOpen={showPay}
        onClose={() => setShowPay(false)}
        size="lg"
        isCentered
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Secure Payment</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {/* Moyasar mounts its form inside this element */}
            <div className="mysr-form"></div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
