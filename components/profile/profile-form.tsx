'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { isApiError } from '@/lib/api/errors';
import { useAuthStore } from '@/lib/auth';
import { ProfileInput, profileSchema, usersApi } from '@/lib/users';

export function ProfileForm(): React.JSX.Element | null {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { displayName: user?.displayName ?? '' },
  });

  if (!user) {
    return null;
  }

  const onSubmit = async (values: ProfileInput): Promise<void> => {
    setIsSubmitting(true);
    try {
      const updated = await usersApi.updateProfile({ displayName: values.displayName });
      setUser(updated);
      form.reset({ displayName: updated.displayName });
      toast.success('Profile updated');
    } catch (error) {
      if (isApiError(error)) {
        toast.error(error.message);
      } else {
        toast.error('Unable to update the profile. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input value={user.email} disabled />
          </FormControl>
        </FormItem>

        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display name</FormLabel>
              <FormControl>
                <Input autoComplete="name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          size="sm"
          className="self-start"
          disabled={isSubmitting || !form.formState.isDirty}
        >
          {isSubmitting ? 'Saving...' : 'Save changes'}
        </Button>
      </form>
    </Form>
  );
}