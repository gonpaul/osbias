'use client';

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '@/lib/redux/store';
import { fetchMe } from './slices/authSlice';

export default function SessionBootstrap() {
  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);
  return null;
}