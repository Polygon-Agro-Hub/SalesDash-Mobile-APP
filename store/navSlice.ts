import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface InputState {
  isClick: number;
}

const initialState: InputState = {
  isClick: 0,
};

const inputSlice = createSlice({
  name: "input",
  initialState,
  reducers: {
    setInputClick(state, action: PayloadAction<number>) {
      state.isClick = action.payload;
    },
    clearInputClick(state) {
      state.isClick = 0;
    },
  },
});

export const { setInputClick, clearInputClick } = inputSlice.actions;
export default inputSlice.reducer;