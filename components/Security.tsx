import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { toast } from 'sonner';
import Cookies from "js-cookie";
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { EyeIcon, EyeSlashIcon } from '@phosphor-icons/react';

export default function Security() {
    const [passwordForm, setPasswordForm] = useState({
        oldPassword: '',
        newPassword: '',
        repeatPassword: '',
    });
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showRepeat, setShowRepeat] = useState(false);
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [isLoading, setIsLoading] = useState(false);

    const handleBlur = (field: string) => {
        setTouched(prev => ({ ...prev, [field]: true }));
    };

    const errors = {
        oldPassword: touched.oldPassword && !passwordForm.oldPassword ? 'Old password is required' : '',
        newPassword: 
            touched.newPassword && passwordForm.newPassword
                ? (passwordForm.newPassword.length < 6 ? 'Password must be at least 6 characters' : 
                   passwordForm.newPassword === passwordForm.oldPassword ? 'New password must be different' : '')
                : touched.newPassword ? 'New password is required' : '',
        repeatPassword: 
            touched.repeatPassword && passwordForm.repeatPassword
                ? (passwordForm.repeatPassword !== passwordForm.newPassword ? 'Passwords do not match' : '')
                : touched.repeatPassword ? 'Please repeat your new password' : '',
    };

    const hasErrors = Object.values(errors).some(Boolean) || 
                      !passwordForm.oldPassword || 
                      !passwordForm.newPassword || 
                      !passwordForm.repeatPassword;

    const handleUpdatePassword = async () => {
        setTouched({ oldPassword: true, newPassword: true, repeatPassword: true });
        
        if (hasErrors || passwordForm.newPassword.length < 6 || 
            passwordForm.newPassword === passwordForm.oldPassword || 
            passwordForm.newPassword !== passwordForm.repeatPassword) {
            return;
        }

        setIsLoading(true);
        const token = Cookies.get("authToken");

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/change-password/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    old_password: passwordForm.oldPassword,
                    new_password: passwordForm.newPassword,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || data.detail || "Failed to update password");
            }

            toast.success("Password updated successfully!");
            setPasswordForm({ oldPassword: '', newPassword: '', repeatPassword: '' });
            setTouched({});
        } catch (err: any) {
            toast.error(err.message || "Failed to update password. Please check your old password.");
        } finally {
            setIsLoading(false);
        }
    };

    const getInputBorder = (field: 'oldPassword' | 'newPassword' | 'repeatPassword') => {
        if (!touched[field]) return 'focus:border-[#028700]';
        return errors[field] ? 'border-b-red-500 focus:border-red-500' : 'focus:border-[#028700]';
    };

    return (
        <div>
            <Card className="shadow-sm max-w-3xl mx-auto rounded-sm p-6 border-none">
                <h1 className="text-xl font-bold mb-6">Update Password</h1>
                <CardContent className="p-6 space-y-6">

                    {/* Old Password */}
                    <div className="space-y-1">
                        <Label>Current Password</Label>
                        <div className="relative">
                            <Input
                                type={showOld ? "text" : "password"}
                                placeholder="••••••••"
                                value={passwordForm.oldPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                                onBlur={() => handleBlur('oldPassword')}
                                className={`rounded-sm bg-[#F2F7FB] border-[#D9D9D9] outline-none border-t-0 border-x-0 active:border-b-2 border-b-2 shadow-none py-6 focus:outline-none pr-12 ${getInputBorder('oldPassword')}`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowOld(!showOld)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                {showOld ? <EyeSlashIcon size={24} /> : <EyeIcon size={24} />}
                            </button>
                        </div>
                        {errors.oldPassword && <p className="text-red-500 text-sm mt-1">{errors.oldPassword}</p>}
                    </div>

                    {/* New Password */}
                    <div className="space-y-1">
                        <Label>New Password</Label>
                        <div className="relative">
                            <Input
                                type={showNew ? "text" : "password"}
                                placeholder="••••••••"
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                onBlur={() => handleBlur('newPassword')}
                                className={`rounded-sm bg-[#F2F7FB] border-[#D9D9D9] outline-none border-t-0 border-x-0 active:border-b-2 border-b-2 shadow-none py-6 focus:outline-none pr-12 ${getInputBorder('newPassword')}`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowNew(!showNew)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                {showNew ? <EyeSlashIcon size={24} /> : <EyeIcon size={24} />}
                            </button>
                        </div>
                        {errors.newPassword && <p className="text-red-500 text-sm mt-1">{errors.newPassword}</p>}
                        {passwordForm.newPassword && passwordForm.newPassword.length < 6 && touched.newPassword && (
                            <p className="text-xs text-orange-600 mt-1">Use 6+ characters for stronger security</p>
                        )}
                    </div>

                    {/* Repeat Password */}
                    <div className="space-y-1">
                        <Label>Confirm New Password</Label>
                        <div className="relative">
                            <Input
                                type={showRepeat ? "text" : "password"}
                                placeholder="••••••••"
                                value={passwordForm.repeatPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, repeatPassword: e.target.value })}
                                onBlur={() => handleBlur('repeatPassword')}
                                className={`rounded-sm bg-[#F2F7FB] border-[#D9D9D9] outline-none border-t-0 border-x-0 active:border-b-2 border-b-2 shadow-none py-6 focus:outline-none pr-12 ${getInputBorder('repeatPassword')}`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowRepeat(!showRepeat)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                {showRepeat ? <EyeSlashIcon size={24} /> : <EyeIcon size={24} />}
                            </button>
                        </div>
                        {errors.repeatPassword && <p className="text-red-500 text-sm mt-1">{errors.repeatPassword}</p>}
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button
                            onClick={handleUpdatePassword}
                            disabled={hasErrors || isLoading || passwordForm.newPassword.length < 6}
                            className="py-6 px-8 bg-[#028700] rounded-sm hover:bg-[#028700eb] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {isLoading ? "Updating..." : "Update Password"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}