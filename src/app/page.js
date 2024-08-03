"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Stack,
  Typography,
  Modal,
  TextField,
  Card,
  CardContent,
  CardActions,
  Button,
  Fab,
  Grid,
  useTheme,
  useMediaQuery,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import { firestore } from "./firebase";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import OpenAI from "openai";
import Image from "next/image";
import addIcon from "./plus.png"; // Make sure this path is correct

// Create a theme with Poppins font
const theme = createTheme({
  typography: {
    fontFamily: "Poppins, sans-serif",
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;700&display=swap');
      `,
    },
  },
});

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  fontFamily: "Poppins, sans-serif",
};

const fetchOpenAIResponse = async (url) => {
  const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  });

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "user",
        content: "What is the image if you can say it in a word or two?",
      },
      {
        role: "user",
        content: url,
      },
    ],
  });

  console.log(response.choices[0].message.content);
  return response.choices[0].message.content.trim();
};

const fetchOpenAIRecipe = async (item) => {
  try {
    const response = await fetch(`/api`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ item: item }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch recipe");
    }

    const data = await response.json();
    console.log(data.recipe);

    return data.recipe;
  } catch (error) {
    console.error(error);
    alert("Failed to fetch recipe");
  }
};

const Home = () => {
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [recipeOpen, setRecipeOpen] = useState(false);
  const [recipe, setRecipe] = useState({});
  const [selectedItem, setSelectedItem] = useState("");
  const [loading, setLoading] = useState(false);
  const [addByUrl, setAddByUrl] = useState(false);
  const [url, setUrl] = useState("");
  const [itemName, setItemName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const updateInventory = async () => {
    try {
      const snapshot = await getDocs(collection(firestore, "inventory"));
      const inventoryList = [];
      snapshot.forEach((doc) => {
        inventoryList.push({ id: doc.id, ...doc.data() });
      });
      setInventory(inventoryList);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    }
  };

  useEffect(() => {
    updateInventory();
  }, []);

  const filterInventory = async (term) => {
    try {
      const snapshot = await getDocs(collection(firestore, "inventory"));
      const filteredList = [];
      snapshot.forEach((doc) => {
        if (doc.id.toLowerCase().includes(term.toLowerCase())) {
          filteredList.push({ id: doc.id, ...doc.data() });
        }
      });
      setInventory(filteredList);
    } catch (error) {
      console.error("Error filtering inventory:", error);
    }
  };

  const addItem = async (item) => {
    try {
      const docRef = doc(collection(firestore, "inventory"), item);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const { quantity } = docSnap.data();
        await setDoc(docRef, { quantity: quantity + 1 });
      } else {
        await setDoc(docRef, { quantity: 1 });
      }
      await updateInventory();
    } catch (error) {
      console.error("Error adding item:", error);
    }
  };

  const addImage = async (url) => {
    try {
      const image = await fetchOpenAIResponse(url);
      const docRef = doc(collection(firestore, "inventory"), image);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const { quantity } = docSnap.data();
        await setDoc(docRef, { quantity: quantity + 1 });
      } else {
        await setDoc(docRef, { quantity: 1 });
      }
      await updateInventory();
    } catch (error) {
      console.error("Error adding item:", error);
    }
  };

  const removeItem = async (item) => {
    try {
      const docRef = doc(collection(firestore, "inventory"), item);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const { quantity } = docSnap.data();
        if (quantity === 1) {
          await deleteDoc(docRef);
        } else {
          await setDoc(docRef, { quantity: quantity - 1 });
        }
      }
      await updateInventory();
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  const handleItemClick = async (item) => {
    setSelectedItem(item);
    if (recipe[item]) {
      // If recipe is already cached, display it
      setRecipeOpen(true);
    } else {
      // Fetch recipe from OpenAI API
      setLoading(true);
      try {
        const fetchedRecipe = await fetchOpenAIRecipe(item);
        setRecipe((prevRecipes) => ({ ...prevRecipes, [item]: fetchedRecipe }));
        setLoading(false);
        setRecipeOpen(true);
      } catch (error) {
        console.error("Error fetching recipe:", error);
        setLoading(false);
      }
    }
  };

  const handleRecipeClose = () => {
    setRecipeOpen(false);
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    if (e.target.value === "") {
      updateInventory();
    } else {
      filterInventory(e.target.value);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: theme.palette.background.default,
          py: 5,
          fontFamily: "Poppins, sans-serif",
        }}
      >
        <Container maxWidth="md">
          <Typography
            variant="h2"
            color="primary"
            align="center"
            gutterBottom
            sx={{ fontWeight: "bold" }}
          >
            Pantry Items
          </Typography>

          <TextField
            label="Search"
            variant="outlined"
            fullWidth
            value={searchTerm}
            onChange={handleSearch}
            sx={{
              mb: 4,
              bgcolor: "background.paper",
              fontFamily: "Poppins, sans-serif",
            }}
            InputProps={{
              style: { fontFamily: "Poppins, sans-serif" },
            }}
            InputLabelProps={{
              style: { fontFamily: "Poppins, sans-serif" },
            }}
          />

          <Grid container spacing={3}>
            {inventory.map(({ id, quantity }) => (
              <Grid item xs={12} sm={6} md={4} key={id}>
                <Card
                  variant="outlined"
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    transition: "0.3s",
                    "&:hover": {
                      boxShadow: 6,
                    },
                    fontFamily: "Poppins, sans-serif",
                  }}
                  onClick={() => handleItemClick(id)}
                >
                  <CardContent>
                    <Typography
                      variant="h6"
                      component="div"
                      sx={{ fontWeight: "bold" }}
                    >
                      {id.charAt(0).toUpperCase() + id.slice(1)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Quantity: {quantity}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent the card click event
                        removeItem(id);
                      }}
                      fullWidth
                      sx={{
                        fontFamily: "Poppins, sans-serif",
                        fontWeight: "bold",
                      }}
                    >
                      Remove
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>

        <Fab
          color="primary"
          aria-label="add"
          onClick={handleOpen}
          sx={{
            position: "fixed",
            bottom: theme.spacing(4),
            right: theme.spacing(4),
            width: 56,
            height: 56,
            "&:hover": {
              backgroundColor: "transparent",
            },
          }}
        >
          <Image src={addIcon} alt="Add New Item" width={75} height={75} />
        </Fab>

        <Modal
          open={open}
          onClose={handleClose}
          closeAfterTransition
          BackdropProps={{
            timeout: 500,
          }}
        >
          <Box sx={modalStyle}>
            <Typography
              variant="h6"
              component="h2"
              gutterBottom
              sx={{ fontWeight: "bold" }}
            >
              Add Item
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="center" mb={3}>
              <Button
                variant={addByUrl ? "contained" : "outlined"}
                onClick={() => setAddByUrl(true)}
                sx={{ fontFamily: "Poppins, sans-serif", fontWeight: "bold" }}
              >
                Add Image URL
              </Button>
              <Button
                variant={!addByUrl ? "contained" : "outlined"}
                onClick={() => setAddByUrl(false)}
                sx={{ fontFamily: "Poppins, sans-serif", fontWeight: "bold" }}
              >
                Add By Name
              </Button>
            </Stack>

            {addByUrl ? (
              <Stack spacing={2}>
                <TextField
                  label="Image URL"
                  variant="outlined"
                  fullWidth
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  InputProps={{
                    style: { fontFamily: "Poppins, sans-serif" },
                  }}
                  InputLabelProps={{
                    style: { fontFamily: "Poppins, sans-serif" },
                  }}
                />
                <Button
                  variant="contained"
                  onClick={async () => {
                    await addImage(url);
                    setUrl("");
                    handleClose();
                  }}
                  fullWidth
                  sx={{ fontFamily: "Poppins, sans-serif", fontWeight: "bold" }}
                >
                  Add
                </Button>
              </Stack>
            ) : (
              <Stack spacing={2}>
                <TextField
                  label="Item Name"
                  variant="outlined"
                  fullWidth
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  InputProps={{
                    style: { fontFamily: "Poppins, sans-serif" },
                  }}
                  InputLabelProps={{
                    style: { fontFamily: "Poppins, sans-serif" },
                  }}
                />
                <Button
                  variant="contained"
                  onClick={() => {
                    addItem(itemName);
                    setItemName("");
                    handleClose();
                  }}
                  fullWidth
                  sx={{ fontFamily: "Poppins, sans-serif", fontWeight: "bold" }}
                >
                  Add
                </Button>
              </Stack>
            )}
          </Box>
        </Modal>

        <Modal
          open={recipeOpen}
          onClose={handleRecipeClose}
          closeAfterTransition
          BackdropProps={{
            timeout: 500,
          }}
        >
          <Box sx={modalStyle}>
            <Typography
              variant="h6"
              component="h2"
              gutterBottom
              sx={{ fontWeight: "bold", color: "black" }} // Update color to black
            >
              Recipe
            </Typography>
            {loading ? (
              <Typography variant="body1">Loading...</Typography>
            ) : (
              <Typography
                variant="body1"
                sx={{ whiteSpace: "pre-wrap", color: "black" }} // Update color to improve readability
              >
                {recipe[selectedItem]}
              </Typography>
            )}
            <Button
              variant="contained"
              onClick={handleRecipeClose}
              fullWidth
              sx={{
                mt: 2,
                fontFamily: "Poppins, sans-serif",
                fontWeight: "bold",
              }}
            >
              Close
            </Button>
          </Box>
        </Modal>
      </Box>
    </ThemeProvider>
  );
};

export default Home;
