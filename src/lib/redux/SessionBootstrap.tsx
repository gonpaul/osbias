'use client';

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { fetchMe } from './slices/authSlice';

export default function SessionBootstrap() {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch<any>(fetchMe());
  }, [dispatch]);
  return null;
}